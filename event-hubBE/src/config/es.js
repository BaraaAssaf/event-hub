import { Client } from '@elastic/elasticsearch';
import { env } from './env.js';

export const esClient = new Client({ node: env.esNode });

export const esStatus = { available: false };

export async function connectElasticsearch({ retries = 15, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await esClient.ping();
      esStatus.available = true;
      console.log('[elasticsearch] connected');
      return true;
    } catch (err) {
      console.warn(
        `[elasticsearch] ping attempt ${attempt}/${retries} failed: ${err.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.warn(
    '[elasticsearch] not available — search endpoints will return a clear error, ' +
      'the rest of the API will keep working'
  );
  esStatus.available = false;
  return false;
}
