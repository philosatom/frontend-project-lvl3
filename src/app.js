import 'bootstrap/js/dist/modal';
import axios from 'axios';
import i18n from 'i18next';
import _ from 'lodash';
import resources from './locales';
import initView from './view.js';
import getValidator from './validator.js';
import parseRSS from './parser.js';

const defaultOptions = {
  language: 'ru',
  timeoutDelay: 5000,
};

const formStates = {
  filling: 'filling',
  processing: 'processing',
  processed: 'processed',
  failed: 'failed',
};

const getProxiedURL = (url) => {
  const proxiedURL = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');

  proxiedURL.searchParams.set('url', url);
  proxiedURL.searchParams.set('disableCache', 'true');

  return proxiedURL.toString();
};

const watchFeeds = (state, delay) => {
  const promises = state.feeds.map((feed) => (
    axios.get(getProxiedURL(feed.url))
      .then(({ data }) => {
        const { items } = parseRSS(data.contents);
        const newItems = _.differenceWith(items, state.posts, (item, post) => (
          _.isEqual(item, _.omit(post, ['id', 'feedId']))
        ));

        return newItems.map((item) => (
          { id: _.uniqueId(), feedId: feed.id, ...item }
        ));
      })
      .catch(() => null)
  ));

  Promise.all(promises).then((values) => {
    const newPosts = values
      .filter((value) => value !== null)
      .flat();

    state.posts.unshift(...newPosts);
    setTimeout(() => watchFeeds(state, delay), delay);
  });
};

const handleInput = (field, { form }) => {
  form.state = formStates.filling;
  form.data = field.value;
};

const getErrorType = (error) => {
  if (error.isAxiosError) return 'network';
  if (error.isRSSParserError) return 'rss';
  return 'unknown';
};

const handleSubmit = (state, getValidationError) => {
  state.form.error = null;

  const url = state.form.data.trim();

  state.form.state = formStates.processing;
  state.form.error = getValidationError(url);
  state.form.isValid = state.form.error === null;

  if (!state.form.isValid) {
    state.form.state = formStates.failed;
    return;
  }

  axios.get(getProxiedURL(url))
    .then(({ data }) => {
      const { items, ...feedData } = parseRSS(data.contents);
      const newFeed = { id: _.uniqueId(), url, ...feedData };
      const newPosts = items.map((item) => (
        { id: _.uniqueId(), feedId: newFeed.id, ...item }
      ));

      state.feeds.unshift(newFeed);
      state.posts.unshift(...newPosts);

      state.form.state = formStates.processed;
      state.form.data = '';
    })
    .catch((error) => {
      state.form.state = formStates.failed;

      const errorType = getErrorType(error);
      state.form.error = `form.messages.errors.${errorType}`;
    });
};

const clickHandlersByTagName = {
  A: (postId, state) => {
    state.readPostIds.add(postId);
  },
  BUTTON: (postId, state) => {
    state.modalWindow.postId = postId;
    state.readPostIds.add(postId);
  },
};

const handleClick = (target, state) => {
  const postId = target.dataset.id;
  const handle = clickHandlersByTagName[target.tagName] ?? _.noop;
  handle(postId, state);
};

export default ({ language, timeoutDelay } = defaultOptions) => {
  const state = {
    form: {
      state: formStates.filling,
      data: '',
      isValid: true,
      error: null,
    },
    feeds: [],
    posts: [],
    readPostIds: new Set(),
    modalWindow: {
      postId: null,
    },
  };

  const form = document.querySelector('.rss-form');
  const urlField = form.elements.url;
  const submitButton = form.querySelector('button');
  const feedbackElement = document.querySelector('.feedback');
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');
  const modalWindowTitle = document.querySelector('.modal-title');
  const modalWindowBody = document.querySelector('.modal-body');
  const modalWindowLink = document.querySelector('a.full-article');

  const elements = {
    form,
    urlField,
    submitButton,
    feedbackElement,
    feedsContainer,
    postsContainer,
    modalWindowTitle,
    modalWindowBody,
    modalWindowLink,
  };

  return i18n.init({ lng: language, resources })
    .then(() => {
      const watchedState = initView(state, elements, i18n);
      const getValidationError = getValidator(watchedState);

      urlField.addEventListener('input', () => {
        handleInput(urlField, watchedState);
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSubmit(watchedState, getValidationError);
      });

      postsContainer.addEventListener('click', ({ target }) => {
        handleClick(target, watchedState);
      });

      setTimeout(() => watchFeeds(watchedState, timeoutDelay), timeoutDelay);
    });
};
