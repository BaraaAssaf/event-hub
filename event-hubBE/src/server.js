import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './config/db.js';
import { connectElasticsearch } from './config/es.js';
import { ensureEventsIndex } from './search/event.search.js';

async function bootstrap() {
  await connectMongo();

  const esReady = await connectElasticsearch();
  if (esReady) {
    try {
      await ensureEventsIndex();
    } catch (err) {
      console.error(`[elasticsearch] could not create the events index: ${err.message}`);
    }
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
    console.log(`[server] api docs at http://localhost:${env.port}/api/docs`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      console.log(`[server] ${signal} received, shutting down`);
      server.close(() => process.exit(0));
    });
  }
}

bootstrap().catch((err) => {
  console.error('[server] fatal error during bootstrap', err);
  process.exit(1);
});
