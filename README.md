# EventHub

Organizers publish events at venues; attendees register (capacity-capped, race-safe). Search is powered by Elasticsearch. Stack: Node/Express API, Vue 3 client, MongoDB, Elasticsearch — one Docker Compose command.

## Prerequisites

- **Docker** + Docker Compose v2 (`docker compose`)
- Nothing else to run the stack. **Node.js 22+** only if you run API/FE outside Docker.

## Environment variables

See [`event-hubBE/.env.example`](event-hubBE/.env.example). Not required for Compose (defaults are set in `docker-compose.yml`). Copy to `event-hubBE/.env` only for host runs or overrides.

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `ES_NODE` | Elasticsearch URL |
| `ES_EVENTS_INDEX` | Search index name (`events`) |
| `JWT_SECRET` | JWT signing key — change it |
| `JWT_EXPIRES_IN` | Token lifetime (`7d`) |
| `CLIENT_ORIGIN` | CORS origin (`http://localhost:5173`) |

## Start everything

```bash
git clone <this-repo>
cd event-hub
docker compose up -d --build
```

Seed runs automatically on first start (empty DB).

| URL | What |
|---|---|
| http://localhost:5173 | Web app |
| http://localhost:3000/api | API |
| http://localhost:3000/api/docs | Swagger UI |API docs
| http://localhost:3000/api/docs.json | OpenAPI (import into Postman) |
| http://localhost:3000/api/health | Health check |
| http://localhost:5601 | Kibana |
| `localhost:27017` | MongoDB |
| http://localhost:9200 | Elasticsearch |

## Seed & search index

| Command | What |
|---|---|
| *(automatic)* | Compose `seed` service runs on first up |
| `docker compose exec api npm run seed` | Seed users/venues/events/registrations + rebuild search index. Skips if DB already has users. |
| `docker compose exec api npm run reindex` | Rebuild Elasticsearch index from MongoDB only |

## Test credentials

Password for all: **`Password123!`**

| Role | Email |
|---|---|
| organizer | `organizer@eventhub.dev` |
| attendee | `attendee@eventhub.dev` |

## Tests

```bash
docker compose exec api npm test    # backend (needs Mongo + ES)
cd event-hubFE && npm test          # frontend units
```

## Done / skipped / known issues

**Done:** Full API (auth, venues, events, register/cancel, capacity + race safety, aggregations), Elasticsearch search + reindex, seed + Swagger, Vue client (browse/search, detail, registrations, organizer dashboard), Docker Compose stack, backend + frontend tests, CI.

**Skipped:** Waitlist, autocomplete suggester, geo search, E2E browser tests.

**Known issues:**
- Inline ES writes can drift if ES fails after Mongo commit — fix with `npm run reindex`

