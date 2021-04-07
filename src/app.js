/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import _ from 'lodash';
import resources from './locales';

const FORM_STATES = {
  filling: 'filling',
  processing: 'processing',
  processed: 'processed',
  failed: 'failed',
};

const routes = {
  origin: 'https://hexlet-allorigins.herokuapp.com',
  getPath: '/get',
};

const schema = yup.string().url();
const getValidationError = (url, { feeds }) => null;

// TODO: реализовать валидацию введённых данных в отдельном модуле

const handleInput = (field, { form }) => {
  form.state = FORM_STATES.filling;
  form.data = field.value;
};

const handleSubmit = (state) => {
  const url = state.form.data.trim();

  state.form.state = FORM_STATES.processing;
  state.form.error = getValidationError(url, state);
  state.form.isValid = state.form.error === null;

  if (!state.form.isValid) return;

  axios.get(routes.getPath, {
    baseURL: routes.origin,
    params: { url },
  }).then(({ data }) => {
    if (!/rss/.test(data.status.content_type)) {
      state.form.state = FORM_STATES.failed;
      state.form.error = 'form.messages.errors.rss';
      return;
    }

    state.form.state = FORM_STATES.processed;
    state.form.data = '';
    state.form.error = null;

    const { items, ...feedData } = parseRSS(data.contents);
    // TODO: реализовать парсер (из rss в object)
    const feedId = _.uniqueId();
    const newFeed = { id: feedId, url, ...feedData };
    const newPosts = items.map((item) => ({ feedId, ...item }));

    state.feeds.push(newFeed);
    state.posts.push(...newPosts);
  }).catch(() => {
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
  };

  const form = document.querySelector('.rss-form');
  const urlField = form.elements.url;

  i18n.init({ lng: 'en', resources })
    .then(() => {
      urlField.addEventListener('input', () => {
        handleInput(urlField, state);
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleSubmit(state);
      });
    });
};
