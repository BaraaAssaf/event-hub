import { esClient, esStatus } from '../config/es.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { eventsIndexMapping, eventsIndexSettings } from './events.mapping.js';

const INDEX = env.esEventsIndex;

export async function ensureEventsIndex() {
  const exists = await esClient.indices.exists({ index: INDEX });
  if (exists) return false;

  await esClient.indices.create({
    index: INDEX,
    mappings: eventsIndexMapping,
    settings: eventsIndexSettings,
  });
  console.log(`[elasticsearch] created index "${INDEX}"`);
  return true;
}

export async function recreateEventsIndex() {
  if (await esClient.indices.exists({ index: INDEX })) {
    await esClient.indices.delete({ index: INDEX });
  }
  await esClient.indices.create({
    index: INDEX,
    mappings: eventsIndexMapping,
    settings: eventsIndexSettings,
  });
}

export function toSearchDocument(event) {
  const venue = event.venue ?? {};
  const organizer = event.organizer ?? {};
  const coordinates = venue.location?.coordinates;

  return {
    title: event.title,
    description: event.description,
    city: venue.city ?? null,
    categories: event.categories ?? [],
    startsAt: event.startsAt,
    price: event.price,
    venueId: venue._id ? String(venue._id) : null,
    venueName: venue.name ?? null,
    location:
      Array.isArray(coordinates) && coordinates.length === 2
        ? { lon: coordinates[0], lat: coordinates[1] }
        : null,
    organizerId: organizer._id ? String(organizer._id) : null,
    organizerName: organizer.name ?? null,
  };
}

export async function indexEvent(event) {
  try {
    await esClient.index({
      index: INDEX,
      id: String(event._id),
      document: toSearchDocument(event),
      refresh: 'wait_for',
    });
    esStatus.available = true;
    return true;
  } catch (err) {
    esStatus.available = false;
    console.error(`[elasticsearch] failed to index event ${event._id}: ${err.message}`);
    return false;
  }
}

export async function removeEventFromIndex(eventId) {
  try {
    await esClient.delete({ index: INDEX, id: String(eventId), refresh: 'wait_for' });
    esStatus.available = true;
    return true;
  } catch (err) {
    if (err.meta?.statusCode === 404) return true;
    esStatus.available = false;
    console.error(`[elasticsearch] failed to remove event ${eventId}: ${err.message}`);
    return false;
  }
}

export async function bulkIndexEvents(events) {
  if (events.length === 0) return 0;

  const operations = events.flatMap((event) => [
    { index: { _index: INDEX, _id: String(event._id) } },
    toSearchDocument(event),
  ]);

  const result = await esClient.bulk({ operations, refresh: true });
  if (result.errors) {
    const firstError = result.items.find((item) => item.index?.error)?.index.error;
    throw new Error(`Bulk indexing failed: ${JSON.stringify(firstError)}`);
  }
  return events.length;
}

function buildQuery({ q, city, category, from, to, minPrice, maxPrice }) {
  const filter = [];

  if (city) filter.push({ term: { city } });
  if (category) filter.push({ term: { categories: category } });

  if (from || to) {
    filter.push({ range: { startsAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.push({
      range: {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      },
    });
  }

  const must = q
    ? [
        {
          multi_match: {
            query: q,
            fields: ['title^3', 'description'],
            fuzziness: 'AUTO',
            prefix_length: 1,
          },
        },
      ]
    : [{ match_all: {} }];

  return { bool: { must, filter } };
}

function buildSort(sort, hasQuery) {
  if (sort === 'soonest') return [{ startsAt: 'asc' }];
  if (sort === 'cheapest') return [{ price: 'asc' }, { startsAt: 'asc' }];
  return hasQuery ? ['_score', { startsAt: 'asc' }] : [{ startsAt: 'asc' }];
}

export async function searchEvents(params) {
  const { page, limit, sort, q } = params;
  const from = (page - 1) * limit;

  let result;
  try {
    result = await esClient.search({
      index: INDEX,
      from,
      size: limit,
      query: buildQuery(params),
      sort: buildSort(sort, Boolean(q)),
      highlight: {
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
        fields: { title: {}, description: { fragment_size: 150, number_of_fragments: 1 } },
      },
      track_total_hits: true,
    });
    esStatus.available = true;
  } catch (err) {
    esStatus.available = false;
    if (err.meta?.statusCode === 404) {
      throw ApiError.serviceUnavailable(
        `Search index "${INDEX}" does not exist. Run "npm run reindex" to build it.`
      );
    }
    throw ApiError.serviceUnavailable(`Search is unavailable: ${err.message}`);
  }

  const total = result.hits.total?.value ?? 0;

  return {
    items: result.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
      highlight: hit.highlight ?? {},
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
