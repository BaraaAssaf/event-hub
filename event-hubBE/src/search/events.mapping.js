
export const eventsIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0, 
  analysis: {
    filter: {
      event_word_delimiter: {
        type: 'word_delimiter_graph',
        preserve_original: true,
      },
    },
    analyzer: {
      event_text: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding', 'event_word_delimiter'],
      },
      event_text_search: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
    },
  },
};


export const eventsIndexMapping = {
  dynamic: 'strict',
  properties: {
    title: { type: 'text', analyzer: 'event_text', search_analyzer: 'event_text_search' },
    description: { type: 'text', analyzer: 'event_text', search_analyzer: 'event_text_search' },
    city: { type: 'keyword' },
    categories: { type: 'keyword' },
    startsAt: { type: 'date' },
    price: { type: 'double' },
    venueId: { type: 'keyword' },
    venueName: { type: 'keyword' },
    location: { type: 'geo_point' },
    organizerId: { type: 'keyword' },
    organizerName: { type: 'keyword' },
  },
};
