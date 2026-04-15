# Redis Caching in Question Service

## Overview

The question service uses Redis as a cache layer between the API and MongoDB. This reduces database load and improves response times for read-heavy endpoints.

## How It Works

The caching follows a **cache-aside** (lazy-loading) pattern:

### On Read (GET endpoints)

1. Client sends a request
2. Service checks Redis for a cached result
   - **Cache HIT**: return cached data immediately, skip MongoDB entirely
   - **Cache MISS**: query MongoDB, store the result in Redis with a 5-minute TTL, return data

### On Write (admin endpoints)

1. Service performs the MongoDB operation (upsert/delete)
2. All cached keys with the `qs:` prefix are deleted from Redis
3. The next read request will fetch fresh data from MongoDB and repopulate the cache

## Cache Keys

All keys are prefixed with `qs:` to namespace them within Redis.

| Endpoint | Cache Key | Example |
|---|---|---|
| `GET /questions` | `qs:questions:search={search}:topic={topic}:diff={difficulty}:page={page}:size={size}` | `qs:questions:search=:topic=:diff=:page=1:size=10` |
| `GET /questions?topic=Arrays` | `qs:questions:search={search}:topic={topic}:diff={difficulty}:page={page}:size={size}` | `qs:questions:search=:topic=Arrays:diff=:page=1:size=10` |
| `GET /questions?topic=Arrays&difficulty=Easy&page=2&size=20` | `qs:questions:search={search}:topic={topic}:diff={difficulty}:page={page}:size={size}` | `qs:questions:search=:topic=Arrays:diff=Easy:page=2:size=20` |
| `GET /questions/topics` | `qs:topics` | `qs:topics` |
| `GET /questions/{slug}` | `qs:question:{slug}` | `qs:question:two-sum` |
| `GET /history/list?user_id={user_id}&page={page}&size={size}` | `qs:attempts:userid={user_id}:page={page}:size={size}` | `qs:attempts:userid=6801a90b4b4d11f2f5f13d29:page=1:size=10` |

Different query parameter combinations produce different cache entries.

## Cache Invalidation

Cache is invalidated (all `qs:{slug}, qs:topics, qs:questions:*` keys are deleted) when any of these admin endpoints are called:

- `POST /questions/upsert`
- `DELETE /questions/delete`
- `POST /questions/bulk-delete`

Full invalidation is used rather than surgical key deletion because:
- Admin writes are infrequent
- A single question change can affect multiple cached responses (e.g., the questions list, topics list, and the individual question)

History caches are invalidated separately when `POST /history/insert` succeeds:
- All cached keys matching `qs:attempts:userid={user_id}:*` are deleted for each participant in the attempt
- This clears every cached history page for the affected users, so pagination metadata stays in sync without needing per-page bookkeeping

## TTL (Time To Live)

Cached entries automatically expire after **5 minutes** (300 seconds), configurable via the `CACHE_TTL` variable in `main.py`. This ensures data stays reasonably fresh even without explicit invalidation.

## Graceful Degradation

All Redis operations are wrapped in try/except blocks. If Redis is unavailable:
- Cache reads return `None` (treated as a cache miss)
- Cache writes and invalidations silently fail
- The service continues to function normally using MongoDB directly

Redis is an **optimization**, not a requirement.

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `REDIS_URI` | `redis://localhost:6379` | Redis connection URI |

In Docker Compose, this is automatically set to `redis://redis:6379`.

## Testing the Cache

### Inspect Redis directly

```bash
# Connect to Redis CLI
docker exec -it <redis-container> redis-cli

# List all cached keys
KEYS qs:*

# View a cached value
GET qs:topics

# Watch operations in real-time
MONITOR
```

### Observe cache behavior

```bash
# First call - cache MISS (hits MongoDB, populates cache)
curl http://localhost:8000/questions

# Second call - cache HIT (served from Redis)
curl http://localhost:8000/questions

# Admin write - invalidates cache
# (next GET will be a cache MISS again)
```
