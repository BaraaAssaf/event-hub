import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),

  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/eventhub?replicaSet=rs0'),

  esNode: required('ES_NODE', 'http://localhost:9200'),
  esEventsIndex: process.env.ES_EVENTS_INDEX || 'events',

  jwtSecret: required('JWT_SECRET', 'dev-secret-do-not-use-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export const isProd = env.nodeEnv === 'production';
