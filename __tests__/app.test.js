import '@testing-library/jest-dom';
import { screen, getAllByRole, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import fs from 'fs';
import path from 'path';
import run from '../src/app.js';

const getFixturePath = (filename) => (
  path.join(__dirname, '..', '__fixtures__', filename)
);

const pathToHTMLFixture = getFixturePath('index.html');
const initHTML = fs.readFileSync(pathToHTMLFixture, 'utf-8');

const routes = {
  host: 'https://hexlet-allorigins.herokuapp.com',
  invalidURLPath: 'invalid-url',
  nonRSSPath: 'https://google.com',
  validPath: 'https://ru.hexlet.io/lessons.rss',
};

const messages = {
  invalidURL: 'The link must be a valid URL',
  nonRSS: 'Resource does not contain a valid RSS',
  success: 'RSS was loaded successfully',
  nonuniqueURL: 'RSS already exists',
};

nock.disableNetConnect();
let elements;

beforeEach(() => {
  document.body.innerHTML = initHTML;
  run();

  elements = {
    urlInput: screen.getByRole('textbox', { name: /url/i }),
    addButton: screen.getByText(/Add/),
    feedback: screen.getByTestId('feedback'),
    feedsContainer: screen.getByTestId('feeds'),
    postsContainer: screen.getByTestId('posts'),
  };
});

test('Working process', () => {
  userEvent.type(elements.urlInput, routes.invalidURLPath);
  userEvent.click(elements.addButton);

  return waitFor(() => {
    expect(elements.feedback).toHaveTextContent(messages.invalidURL);
  }).then(() => {
    nock(routes.host)
      .get((uri) => uri.includes(encodeURIComponent(routes.nonRSSPath)))
      .reply(200, {
        status: { content_type: 'text/html; charset=utf-8' },
      });

    userEvent.clear(elements.urlInput);
    userEvent.type(elements.urlInput, routes.invalidRSSPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.nonRSS);
    });
  }).then(() => {
    const pathToRSSFixture = getFixturePath('rss.xml');

    nock(routes.host)
      .get((uri) => uri.includes(encodeURIComponent(routes.validPath)))
      .reply(200, {
        contents: fs.readFileSync(pathToRSSFixture, 'utf-8'),
        status: { content_type: 'application/rss+xml; charset=utf-8' },
      });

    userEvent.clear(elements.urlInput);
    userEvent.type(elements.urlInput, routes.validPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      const actualfeedTitles = getAllByRole(elements.feedsContainer, 'heading', { level: 3 })
        .map((element) => element.textContent);
      const expectedFeedTitles = ['Новые уроки на Хекслете'];
      const actualPostTitles = getAllByRole(elements.postsContainer, 'link')
        .map((element) => element.textContent);
      const expectedPostTitles = ['Урок 2', 'Урок 1'];

      expect(elements.feedback).toHaveTextContent(messages.success);
      expect(actualfeedTitles).toEqual(expectedFeedTitles);
      expect(actualPostTitles).toEqual(expectedPostTitles);
    });
  }).then(() => {
    userEvent.type(elements.urlInput, routes.validPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.nonuniqueURL);
    });
  });
});
