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

const renderFormState = (state, { elements, i18n }) => {
  const render = _.get(renderersByFormState, state, _.noop);
  render(elements, i18n);
};

const renderValidity = (isValid, { elements }) => {
  if (isValid) {
    elements.urlField.classList.remove('is-invalid');
  } else {
    elements.urlField.classList.add('is-invalid');
  }
};

const renderError = (error, { elements, i18n }) => {
  if (error === null) {
    elements.feedbackElement.classList.remove('text-danger');
    elements.feedbackElement.textContent = '';
  } else {
    elements.feedbackElement.classList.add('text-danger');
    elements.feedbackElement.textContent = i18n.t(error);
  }
};

const renderFeeds = (feeds, { elements, i18n }) => {
  const sectionTitleElement = document.createElement('h2');
  sectionTitleElement.textContent = i18n.t('feeds');

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'mb-5');

  const feedElements = feeds.map((feed) => {
    const feedElement = document.createElement('li');
    feedElement.classList.add('list-group-item');

    const feedTitleElement = document.createElement('h3');
    feedTitleElement.textContent = feed.title;

    const feedDescriptionElement = document.createElement('p');
    feedDescriptionElement.textContent = feed.description;

    feedElement.append(feedTitleElement, feedDescriptionElement);

    return feedElement;
  });

  listElement.append(...feedElements);
  elements.feedsContainer.append(sectionTitleElement, listElement);
};

const renderPosts = (posts, { elements, i18n }) => {
  const sectionTitleElement = document.createElement('h2');
  sectionTitleElement.textContent = i18n.t('posts');

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group');

  const postElements = posts.map((post) => {
    const postElement = document.createElement('li');
    postElement.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
    );

    const linkElement = document.createElement('a');
    linkElement.classList.add('font-weight-bold');
    linkElement.setAttribute('href', post.link);
    linkElement.setAttribute('data-id', post.id);
    linkElement.setAttribute('target', '_blank');
    linkElement.setAttribute('rel', 'noopener noreferrer');
    linkElement.textContent = post.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-toggle', 'modal');
    button.setAttribute('data-target', '#modal');
    button.textContent = i18n.t('view');

    postElement.append(linkElement, button);

    return postElement;
  });

  listElement.append(...postElements);
  elements.postsContainer.append(sectionTitleElement, listElement);
};

const renderersByPath = {
  'form.state': renderFormState,
  'form.isValid': renderValidity,
  'form.error': renderError,
  feeds: renderFeeds,
  posts: renderPosts,
};

export default (state, elements, i18n) => (
  onChange(state, (path, value) => {
    const render = _.get(renderersByPath, path, _.noop);
    render(value, { elements, i18n });
  })
);
