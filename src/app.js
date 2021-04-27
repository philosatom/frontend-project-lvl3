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

const handleSubmit = (state) => {
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
      const feedId = _.uniqueId();
      const newFeed = { id: feedId, url, ...feedData };
      const newPosts = items.map((item) => {
        const postId = _.uniqueId();
        return { id: postId, feedId, ...item };
      });

      state.feeds.unshift(newFeed);
      state.posts.unshift(...newPosts);
    })
    .catch(() => {
      state.form.state = FORM_STATES.failed;
      state.form.error = 'form.messages.errors.network';
    });
};

export default () => {
  const state = {
    form: {
      state: FORM_STATES.filling,
      data: '',
      isValid: true,
      error: null,
    },
    feeds: [],
    posts: [],
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

  i18n.init({ lng: 'en', resources })
    .then(() => {
      const watchedState = initView(state, elements, i18n);

      urlField.addEventListener('input', () => {
        handleInput(urlField, watchedState);
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSubmit(watchedState);
      });

      postsContainer.addEventListener('click', ({ target }) => {
        if (target.tagName === 'BUTTON') {
          watchedState.modalWindow.postId = target.dataset.id;
        }
      });
    });
};
