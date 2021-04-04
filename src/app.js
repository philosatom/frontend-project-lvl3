import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
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

const validate = (data) => data;

// TODO: реализовать валидацию введённых данных в отдельном модуле

const handleInput = (field, state) => {
  const { form } = state;
  form.state = FORM_STATES.filling;
  form.data = field.value;
};

const handleSubmit = (state) => {
  const { form } = state;
  const url = form.data.trim();

  form.state = FORM_STATES.processing;

  validate(url, state, i18n);

  if (!form.isValid) return;

  axios.get(routes.getPath, {
    baseURL: routes.origin,
    params: { url },
  }).then(({ data }) => {
    if (!/rss/.test(data.content_type)) {
      form.state = FORM_STATES.failed;
      form.error = i18n.t('form.messages.errors.rss');
      return;
    }

    form.state = FORM_STATES.processed;
    form.data = '';
    form.error = null;

    // TODO: реализовать логику успешного сценария загрузки RSS
  }).catch(() => {
    form.state = FORM_STATES.failed;
    form.error = i18n.t('form.messages.errors.network');
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
