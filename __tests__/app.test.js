import '@testing-library/jest-dom';
import testingLibrary from '@testing-library/dom';
import testingLibraryUserEvent from '@testing-library/user-event';
import nock from 'nock';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import run from '../src/app.js';

const { screen, waitFor } = testingLibrary;
const userEvent = testingLibraryUserEvent.default;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => (
  path.join(__dirname, '..', '__fixtures__', filename)
);

const pathToHTMLFixture = getFixturePath('index.html');
const initHTML = fs.readFileSync(pathToHTMLFixture, 'utf-8');
const pathToRSSFixture = getFixturePath('rss.txt');
const rss = fs.readFileSync(pathToRSSFixture, 'utf-8');

const routes = {
  host: 'https://hexlet-allorigins.herokuapp.com',
  invalidURLPath: 'invalid-url',
  invalidRSSPath: 'https://html-resource.com',
  validPath: 'https://rss-resource.com',
};

const messages = {
  invalidURL: 'The link must be a valid URL',
  invalidRSS: 'Resource does not contain a valid RSS',
  success: 'RSS was loaded successfully',
  nonuniqueURL: 'RSS already exists',
};

nock.disableNetConnect();
let elements;

describe('RSS loader', () => {
  beforeAll(() => {
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

  test('Does not pass validation if an invalid URL is typed', () => {
    userEvent.type(elements.urlInput, routes.invalidURLPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.invalidURL);
    });
  });

  test('Does not load a new RSS feed if a valid non-RSS resource URL is typed', () => {
    nock(routes.host)
      .get((uri) => uri.includes(encodeURIComponent(routes.invalidRSSPath)))
      .reply(200, {
        status: { content_type: 'text/html; charset=utf-8' },
      });

    userEvent.type(elements.urlInput, routes.invalidRSSPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.invalidRSS);
    });
  });

  test('Loads a new RSS feed if a valid RSS resource URL is typed', () => {
    nock(routes.host)
      .get((uri) => uri.includes(encodeURIComponent(routes.validPath)))
      .reply(200, { contents: rss });

    userEvent.type(elements.urlInput, routes.validPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.success);
      expect(elements.feedsContainer).not.toBeEmptyDOMElement();
      expect(elements.postsContainer).not.toBeEmptyDOMElement();
    });
  });

  test('Does not pass validation if a non-unique RSS resource URL is typed', () => {
    userEvent.type(elements.urlInput, routes.validPath);
    userEvent.click(elements.addButton);

    return waitFor(() => {
      expect(elements.feedback).toHaveTextContent(messages.nonuniqueURL);
    });
  });
});
