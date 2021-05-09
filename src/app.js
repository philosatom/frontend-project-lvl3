/* eslint-disable no-param-reassign */

import axios from 'axios';
import i18n from 'i18next';
import _ from 'lodash';
import getValidationError, { yup } from './validator.js';
import resources from './locales';
import initView from './view.js';

const FORM_STATES = {
  filling: 'filling',
  processing: 'processing',
  processed: 'processed',
  failed: 'failed',
};

const routes = {
  origin: 'https://hexlet-allorigins.herokuapp.com',
  getPath: (url) => `/get?url=${encodeURIComponent(url)}`,
};

const defaultTimeoutDelay = 5000;

const schema = yup.string().url().uniqueness();

const toObject = (data) => data.reduce((acc, { tagName, textContent }) => (
  { ...acc, [tagName]: textContent }
), {});

const parseRSS = (rss) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(rss, 'text/xml');
  const channel = xmlDocument.querySelector('channel');

  const [itemElements, feedDataElements] = _.partition(
    [...channel.children],
    ({ tagName }) => tagName === 'item',
  );

  const feedData = toObject(feedDataElements);
  const items = itemElements.map(({ children }) => toObject([...children]));
  return { ...feedData, items };
};

const handleInput = (field, { form }) => {
  form.state = FORM_STATES.filling;
  form.data = field.value;
};

const watchFeeds = (state, delay) => {
  const promises = state.feeds.map((feed) => (
    axios.get(routes.getPath(feed.url), { baseURL: routes.origin })
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

const handleSubmit = (state, timeoutDelay) => {
  state.form.error = null;

  const url = state.form.data.trim();

  state.form.state = FORM_STATES.processing;
  state.form.error = getValidationError(url, schema, state);
  state.form.isValid = state.form.error === null;

  if (!state.form.isValid) {
    state.form.state = FORM_STATES.failed;
    return;
  }

  axios.get(routes.getPath(url), { baseURL: routes.origin })
    .then(({ data }) => {
      if (!/(rss|xml)/.test(data.status.content_type)) {
        state.form.state = FORM_STATES.failed;
        state.form.error = 'form.messages.errors.rss';
        return;
      }

      state.form.state = FORM_STATES.processed;
      state.form.data = '';

      const { items, ...feedData } = parseRSS(data.contents);
      const newFeed = { id: _.uniqueId(), url, ...feedData };
      const newPosts = items.map((item) => (
        { id: _.uniqueId(), feedId: newFeed.id, ...item }
      ));

      state.feeds.unshift(newFeed);
      state.posts.unshift(...newPosts);

      if (!state.timer.isSet) {
        state.timer.isSet = true;
        setTimeout(() => watchFeeds(state, timeoutDelay), timeoutDelay);
      }
    })
    .catch(() => {
      state.form.state = FORM_STATES.failed;
      state.form.error = 'form.messages.errors.network';
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
  const handle = _.get(clickHandlersByTagName, target.tagName, _.noop);
  handle(postId, state);
};

export default (timeoutDelay = defaultTimeoutDelay) => {
  const state = {
    form: {
      state: FORM_STATES.filling,
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
    timer: {
      isSet: false,
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

  i18n.init({ lng: 'en', resources })
    .then(() => {
      const watchedState = initView(state, elements, i18n);

      urlField.addEventListener('input', () => {
        handleInput(urlField, watchedState);
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSubmit(watchedState, timeoutDelay);
      });

      postsContainer.addEventListener('click', ({ target }) => {
        handleClick(target, watchedState);
      });
    });
};
