/* eslint-disable functional/no-class, class-methods-use-this */

import _ from 'lodash';

class RSSParserError extends Error {
  isRSSParserError() {
    return true;
  }
}

const toObject = (data) => data.reduce((acc, { tagName, textContent }) => (
  { ...acc, [tagName]: textContent }
), {});

export default (rss) => {
  try {
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
  } catch {
    throw new RSSParserError('Unable to parse content');
  }
};
