# Architecture

## Data model — references vs embeds

Four collections: `User`, `Venue`, `Event`, `Registration`.

| Relationship | Choice | Why |
|---|---|---|
| Event → Venue | **reference** | One venue hosts many events; capacity must be authoritative in one place; venues are listed/deleted on their own. Embedding would duplicate and stale. |
| Event → Organizer | **reference** | Same person runs many events; organizers are queried independently. |
| Event.categories | **embedded** (`string[]`) | No identity or attributes of their own; only ever read with the event. A collection would just add a join. |
| User ↔ Event | **`Registration` collection** | Array-on-event hits the 16 MB doc limit, can't serve "my registrations" well, and has no home for `status` / `ticketCount`. A join collection also gets a unique `(user, event)` index for no double-register. |

## MongoDB ↔ Elasticsearch sync

MongoDB is source of truth. Elasticsearch is a derived read model for `GET /api/events/search` only.

**Approach:** after create/update/delete commits in Mongo, the service writes the same change to ES inline (`src/search/event.search.js`). ES failures are logged, never returned to the client — the Mongo write already succeeded.

**Where it breaks:**
- ES write fails after Mongo commit → search is stale (deleted events linger, new ones missing). Nothing self-heals.
- Process crash between Mongo commit and ES write → same drift.
- Repair: `npm run reindex` (drop index, recreate from mapping, rebuild from Mongo).

**Better for production:** a transactional outbox (write intent in the same Mongo transaction, worker retries to ES) or change streams.

## Last-seat race condition

Count-then-insert — even inside a transaction — does **not** work. MongoDB snapshot isolation has no predicate locks, so two txs can both read "9/10 taken", insert different registration docs, and both commit (phantom read → overbook).

**Fix:** claim the seat with a conditional update on one document (`Event.seatsTaken`), inside the same transaction as the `Registration` insert:

```js
Event.findOneAndUpdate(
  { _id: eventId, seatsTaken: { $lte: venue.capacity - ticketCount } },
  { $inc: { seatsTaken: ticketCount } },
  { new: true, session }
);
```

Check + increment are one atomic op on the same doc. Concurrent claims conflict; `withTransaction` retries the loser, which then gets a clean 409. Unique `(user, event)` index catches double-click register. Covered by `tests/race.test.js` (12 concurrent / 3 seats → exactly 3 succeed).

`seatsTaken` is denormalized for serialization only; the organizer dashboard counts registrations instead.

## What I'd change first for real traffic

1. **Outbox (or change streams) for ES sync** — only place that can silently serve wrong data.
2. **Seat claims under heavy contention** — hot-document write conflicts don't scale to a 10k on-sale; Redis reservation with short TTL, settle to Mongo async.
3. **Short-lived access + refresh tokens** — 7-day JWT can't be revoked.
4. **Observability** — structured logs with request id, metrics, tracing (`morgan` isn't enough to operate).
