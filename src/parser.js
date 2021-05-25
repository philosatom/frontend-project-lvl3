import _ from 'lodash';

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
    const error = new Error('Unable to parse content');
    error.isRSSParserError = true;
    throw error;
  }
};
