import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './config/db.js';
import { connectElasticsearch } from './config/es.js';

async function bootstrap() {

  await connectMongo();
  await connectElasticsearch();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] fatal error during bootstrap', err);
  process.exit(1);
});
