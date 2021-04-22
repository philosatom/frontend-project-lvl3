/* eslint-disable no-param-reassign */

import _ from 'lodash';
import onChange from 'on-change';

const renderProcessingState = (elements) => {
  elements.submitButton.disabled = true;

  elements.urlField.disabled = true;

  elements.feedbackElement.className = 'feedback';
  elements.feedbackElement.textContent = '';
};

const renderProcessedState = (elements, i18n) => {
  elements.submitButton.disabled = false;

  elements.urlField.disabled = false;
  elements.urlField.value = '';
  elements.urlField.focus();

  elements.feedbackElement.classList.add('text-success');
  elements.feedbackElement.textContent = i18n.t('form.messages.success');
};

const renderFailedState = (elements) => {
  elements.submitButton.disabled = false;
  elements.urlField.disabled = false;
};

const renderersByFormState = {
  processing: renderProcessingState,
  processed: renderProcessedState,
  failed: renderFailedState,
};

const renderFormState = ({ current: state }, elements, i18n) => {
  const render = _.get(renderersByFormState, state, _.noop);
  render(elements, i18n);
};

const renderValidity = ({ current: isValid }, elements) => {
  if (isValid) {
    elements.urlField.classList.remove('is-invalid');
  } else {
    elements.urlField.classList.add('is-invalid');
  }
};

const renderError = ({ current: error }, elements, i18n) => {
  if (error === null) {
    elements.feedbackElement.classList.remove('text-danger');
    elements.feedbackElement.textContent = '';
  } else {
    elements.feedbackElement.classList.add('text-danger');
    elements.feedbackElement.textContent = i18n.t(error);
  }
};

const renderFeeds = ({ current: feeds }, elements, i18n) => {
  const titleElement = document.createElement('h2');
  titleElement.textContent = i18n.t('feeds');

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'mb-5');

  const listItemElements = feeds.map((feed) => {
    const listItemElement = document.createElement('li');
    listItemElement.classList.add('list-group-item');
    listItemElement.innerHTML = `
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    `;

    return listItemElement;
  });

  listItemElements.forEach(listElement.prepend);
  elements.feedsContainer.append(titleElement, listElement);
};

const renderersByPath = {
  'form.state': renderFormState,
  'form.isValid': renderValidity,
  'form.error': renderError,
  feeds: renderFeeds,
};

export default (state, elements, i18n) => (
  onChange(state, (path, current, previous) => {
    const render = _.get(renderersByPath, path, _.noop);
    render({ current, previous }, elements, i18n);
  })
);
