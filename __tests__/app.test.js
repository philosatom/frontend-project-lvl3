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
  validPath1: 'https://ru.hexlet.io/lessons.rss',
  validPath2: 'https://ishadeed.com/feed.xml',
};

const messages = {
  invalidURL: 'The link must be a valid URL',
  nonRSS: 'Resource does not contain a valid RSS',
  success: 'RSS was loaded successfully',
  nonuniqueURL: 'RSS already exists',
};

const timeoutDelay = 0;
const language = 'en';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

let elements; // eslint-disable-line functional/no-let

beforeEach(() => {
  document.body.innerHTML = initHTML;
  run(language, timeoutDelay);

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
      const pathToNonRSSFixture = getFixturePath('nonRSS.html');

      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.nonRSSPath)))
        .reply(200, {
          contents: fs.readFileSync(pathToNonRSSFixture, 'utf-8'),
        });

      userEvent.clear(elements.urlInput);
      userEvent.type(elements.urlInput, routes.nonRSSPath);
      userEvent.click(elements.addButton);

      return waitFor(() => {
        expect(elements.feedback).toHaveTextContent(messages.nonRSS);
      });
    })
    .then(() => {
      const pathToRSSFixture = getFixturePath('rss1_0.xml');

      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.validPath1)))
        .reply(200, {
          contents: fs.readFileSync(pathToRSSFixture, 'utf-8'),
        });

      userEvent.clear(elements.urlInput);
      userEvent.type(elements.urlInput, routes.validPath1);
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

      const readPostLinkELements = getAllByRole(elements.postsContainer, 'link');

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
        readPostLinkELements.forEach((element) => {
          expect(element).toHaveClass('font-weight-normal');
          expect(element).not.toHaveClass('font-weight-bold');
        });

        expect(actualModalData).toEqual(expectedModalData);
      });
    })
    .then(() => {
      const pathToRSSFixture = getFixturePath('rss2_0.xml');

      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.validPath2)))
        .reply(200, {
          contents: fs.readFileSync(pathToRSSFixture, 'utf-8'),
        });

      userEvent.type(elements.urlInput, routes.validPath2);
      userEvent.click(elements.addButton);

      return waitFor(() => {
        const actualfeedTitles = getAllByRole(elements.feedsContainer, 'heading', { level: 3 })
          .map((element) => element.textContent);
        const expectedFeedTitles = ['Ahmad Shadeed Blog', 'Новые уроки на Хекслете'];
        const actualPostTitles = getAllByRole(elements.postsContainer, 'link')
          .map((element) => element.textContent);
        const expectedPostTitles = ['Blog post 1', 'Урок 2', 'Урок 1'];

        expect(elements.feedback).toHaveTextContent(messages.success);
        expect(actualfeedTitles).toEqual(expectedFeedTitles);
        expect(actualPostTitles).toEqual(expectedPostTitles);
      });
    })
    .then(() => {
      const pathToRSSFixture1 = getFixturePath('rss1_1.xml');
      const pathToRSSFixture2 = getFixturePath('rss2_1.xml');

      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.validPath1)))
        .reply(200, {
          contents: fs.readFileSync(pathToRSSFixture1, 'utf-8'),
        });

      nock(routes.origin)
        .get((uri) => uri.includes(encodeURIComponent(routes.validPath2)))
        .reply(200, {
          contents: fs.readFileSync(pathToRSSFixture2, 'utf-8'),
        });

      return waitFor(() => {
        const postLinkELements = getAllByRole(elements.postsContainer, 'link');
        const readPostLinkElements = postLinkELements.slice(-2);
        const actualPostTitles = postLinkELements.map((element) => element.textContent);

        const expectedPostTitles = [
          'Blog post 3', 'Blog post 2', 'Урок 3',
          'Blog post 1', 'Урок 2', 'Урок 1',
        ];

        readPostLinkElements.forEach((element) => {
          expect(element).toHaveClass('font-weight-normal');
          expect(element).not.toHaveClass('font-weight-bold');
        });

        expect(actualPostTitles).toEqual(expectedPostTitles);
      });
    })
    .then(() => {
      userEvent.type(elements.urlInput, routes.validPath1);
      userEvent.click(elements.addButton);

      return waitFor(() => {
        expect(elements.feedback).toHaveTextContent(messages.nonuniqueURL);
      });
    });
});
