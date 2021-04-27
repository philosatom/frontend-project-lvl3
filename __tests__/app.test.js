import '@testing-library/jest-dom';
import { screen, getAllByRole, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
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
  origin: 'https://hexlet-allorigins.herokuapp.com',
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

axios.defaults.adapter = httpAdapter;
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
    modalTitle: screen.getByTestId('modalTitle'),
    modalBody: screen.getByTestId('modalBody'),
    modalLink: screen.getByTestId('modalLink'),
    closeModalButton: screen.getByTestId('closeModalButton'),
  };
});

test('Working process', () => {
  userEvent.type(elements.urlInput, routes.invalidURLPath);
  userEvent.click(elements.addButton);

  return waitFor(() => {
    expect(elements.feedback).toHaveTextContent(messages.invalidURL);
  })
    .then(() => {
      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.nonRSSPath)))
        .reply(200, {
          status: { content_type: 'text/html; charset=utf-8' },
        });

      userEvent.clear(elements.urlInput);
      userEvent.type(elements.urlInput, routes.nonRSSPath);
      userEvent.click(elements.addButton);

      return waitFor(() => {
        expect(elements.feedback).toHaveTextContent(messages.nonRSS);
      });
    })
    .then(() => {
      const pathToRSSFixture = getFixturePath('rss.xml');

      nock(routes.origin)
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
    })
    .then(() => {
      const buttons = getAllByRole(elements.postsContainer, 'button');
      const actualModalData = [];

      buttons.forEach((button) => {
        userEvent.click(button);

        actualModalData.push({
          title: elements.modalTitle.textContent,
          description: elements.modalBody.textContent,
          url: elements.modalLink.getAttribute('href'),
        });

        userEvent.click(elements.closeModalButton);
      });

      const expectedModalData = [
        {
          title: 'Урок 2',
          description: 'Цель урока 2',
          url: 'https://ru.hexlet.io/courses/ruby-compound-data/lessons/points/theory_unit',
        },
        {
          title: 'Урок 1',
          description: 'Цель урока 1',
          url: 'https://ru.hexlet.io/courses/css-content/lessons/overflow/theory_unit',
        },
      ];

      return waitFor(() => {
        expect(actualModalData).toEqual(expectedModalData);
      });
    })
    .then(() => {
      userEvent.type(elements.urlInput, routes.validPath);
      userEvent.click(elements.addButton);

      return waitFor(() => {
        expect(elements.feedback).toHaveTextContent(messages.nonuniqueURL);
      });
    });
});
