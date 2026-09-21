# CONTEXT.md - System Context & Architecture Blueprint

## Architectural Blueprint

```
                     +---------------------------------------+
                     |             Client / Frontend          |
                     +-------------------+-------------------+
                                         |
                                HTTP     |     WebSockets
                             REST APIs   |    (JSON Events)
                                         v
+-----------------------------------------------------------------------------------+
| Path of Ascension Express Server (src/app.ts & src/index.ts)                      |
|                                                                                   |
|  +--------------------+   +----------------------------+   +-------------------+  |
|  | Security / Auth    |   | Controllers                |   | WebSocketService  |  |
|  | Middleware         |   | - GameStateController      |   | (ws Server)       |  |
|  | - Helmet, CORS,    |   | - InvestigationController  |   | - Client Sync     |  |
|  |   Rate Limiting    |   +-------------+--------------+   | - Event Broadcast |  |
|  +--------------------+                 |                  +---------+---------+  |
|                                         v                            |            |
|                           +----------------------------+             |            |
|                           | Services Layer             |<------------+            |
|                           | - GameStateService         |                          |
|                           | - InvestigationService     |                          |
|                           | - ActionResolutionService  |                          |
|                           +-------------+--------------+                          |
+-----------------------------------------|-----------------------------------------+
                                          |
                                          v
                         +---------------------------------+
                         | Database Layer (Mongoose)       |
                         | - GameStateModel                |
                         | - CharacterModel                |
                         | - InvestigationModel            |
                         +---------------------------------+
```

---

## Active API Routes & Handlers

### Health & Information Endpoints

| Method | Endpoint | Description | Response / Status |
|---|---|---|---|
| `GET` | `/health` | System health check (DB, uptime, memory, WS connections) | `200 OK` or `503 Service Unavailable` |
| `GET` | `/ready` | Readiness probe checking MongoDB connectivity | `200 OK` or `503 Service Unavailable` |
| `GET` | `/api` | Basic API info (Name, Version, Environment, Timestamp) | `200 OK` JSON |

### Game State Endpoints (`/api/game-states`)

| Method | Endpoint | Description | Request Body / Query |
|---|---|---|---|
| `POST` | `/api/game-states/games` | Create a new game state instance | `{ initialTime?, timeMultiplier?, settings?, createdBy? }` |
| `GET` | `/api/game-states/games/:id/state` | Retrieve full game state | Path param: `:id` |
| `POST` | `/api/game-states/games/:id/advance-time` | Advance in-game time | `{ hours: number }` |
| `GET` | `/api/game-states/games/:id/health` | Health and uptime status for specific game | Path param: `:id` |
| `DELETE` | `/api/game-states/games/:id` | Remove game state instance | Path param: `:id` |

### Investigation Endpoints (`/api/investigations`)

| Method | Endpoint | Description | Request Body / Query |
|---|---|---|---|
| `POST` | `/api/investigations` | Create new investigation | `{ name, type, difficulty, characterId, gameStateId, ... }` |
| `PATCH` | `/api/investigations/:id/progress` | Update progress, clues, or lead statuses | `{ progressMade, characterId, newCluesDiscovered?, leadsExhausted? }` |
| `GET` | `/api/investigations/:id/leads` | Retrieve active leads for investigation | Path param: `:id` |

---

## WebSocket Messaging Specifications

### Connection Setup

- **URL:** `ws://<host>:<port>/ws?gameStateId=<game-id>`
- Connection handled in `src/services/WebSocketService.ts`.

### Incoming Commands from Client

```json
{
  "type": "command",
  "payload": {
    "command": "subscribe",
    "gameStateId": "uuid-v4-string"
  }
}
```

### Outgoing Server Events

```json
{
  "type": "event",
  "payload": {
    "type": "STATE_UPDATED" | "TIME_ADVANCED" | "CHARACTER_UPDATED" | "INVESTIGATION_UPDATED",
    "gameStateId": "uuid-v4-string",
    "timestamp": "2025-06-09T17:30:00.000Z",
    "data": { ... }
  }
}
```

---

## Class & Core Service Responsibilities

### 1. `App` (`src/app.ts`)
- Configures Express middlewares (`cors`, `express.json`, `securityMiddleware`, logging).
- Initializes HTTP server (`http.createServer`) and `WebSocketService`.
- Binds controller routes (`/api/game-states`, `/api/investigations`).
- Manages startup and graceful shutdown (`SIGINT`/`SIGTERM`) logic.

### 2. `GameStateService` (`src/services/GameStateService.ts`)
- Manages `GameStateModel` database persistence.
- Handles time advancement calculations:
  - Qi regeneration for active characters.
  - Active effect duration expirations.
  - Investigation time remaining updates.
  - Event updates based on configured multipliers.

### 3. `InvestigationService` (`src/services/InvestigationService.ts`)
- Manages `InvestigationModel` database persistence.
- Processes progress updates, clue unlocks, and lead exhaustion calculations.
- Grants completion rewards upon reaching 100% main objective progress.

### 4. `ActionResolutionService` (`src/services/ActionResolutionService.ts`)
- Evaluates character skill and stat requirements against chosen action criteria.
- Applies success/failure outcomes and returns generated effects.

### 5. `WebSocketService` (`src/services/WebSocketService.ts`)
- Tracks client connection set mapped by `gameStateId`.
- Emits real-time state changes to all subscribers of a given game session.
- Monitors ping/pong heartbeats to cleanse stale sockets.

---

## Configuration & Environment References

| Environment Variable | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `3000` | Port for Express HTTP & WebSocket server |
| `MONGODB_URI` | `mongodb://localhost:27017/path-of-ascension` | MongoDB connection URI |
| `JWT_SECRET` | `default-secret-key-change-in-production` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `24h` | Token expiration duration |
| `LOG_LEVEL` | `info` | Winston log output level (`error`, `warn`, `info`, `debug`) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allowed origins |
