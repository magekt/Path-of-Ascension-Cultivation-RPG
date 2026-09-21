# Path of Ascension API

A comprehensive, production-ready backend API for the **Path of Ascension** menu-driven cultivation RPG game, built with Node.js, Express, TypeScript, MongoDB, and WebSockets.

---

## 🚀 Features

- **Real-time Game State Management** - WebSocket-based real-time state updates and client synchronization
- **Cultivation RPG System** - Qi capacity tracking, cultivation stage progress, breakthrough success mechanics, skills, and artifacts
- **Investigation Engine** - Objective trees, clue discovery, evidence gathering, and lead examination
- **NPC & Faction Relationships** - Attitude meters (0-100), milestone unlocks, and sect/faction standing levels
- **Action Resolution Engine** - Requirement checks, skill modifiers, effect application, and cooldown tracking
- **Production Ready** - Security headers via Helmet, CORS, Express rate limiting, Gzip compression, Winston logging, and Docker container support

---

## 🛠️ Local Server Launch & Setup

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **MongoDB**: >= 6.0 (running locally or via Docker)

### Step-by-Step Server Launch

1. **Clone & Install Dependencies**
   ```bash
   git clone <repository-url>
   cd path-of-ascension-api
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   *Verify your `.env` settings:*
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/path-of-ascension
   JWT_SECRET=your-super-secure-secret-key
   LOG_LEVEL=info
   ALLOWED_ORIGINS=http://localhost:3000
   ```

3. **Start MongoDB Database**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0

   # Or run local mongod daemon
   mongod
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   The server will start listening on `http://localhost:3000`.

5. **Verify Server Health**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/ready
   ```

---

## 📚 Core API Endpoints

All protected endpoints require a JWT header:
```http
Authorization: Bearer <your-jwt-token>
```

### Game State Management (`/api/game-states`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/game-states/games` | Create a new game instance |
| `GET` | `/api/game-states/games/:id/state` | Retrieve full game state |
| `POST` | `/api/game-states/games/:id/advance-time` | Advance game time by X hours |
| `POST` | `/api/game-states/games/:id/actions/resolve` | Resolve character action |
| `GET` | `/api/game-states/games/:id/health` | Get game state status |
| `DELETE` | `/api/game-states/games/:id` | Delete game instance |

### Investigation System (`/api/investigations`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/investigations` | Create a new investigation |
| `PATCH` | `/api/investigations/:id/progress` | Update sub-objective progress |
| `GET` | `/api/investigations/:id/leads` | Retrieve active leads |

---

## 🔌 WebSocket Real-time Protocol

Connect to the WebSocket endpoint at:
`ws://localhost:3000/ws?gameStateId=<your-game-id>`

### Client Subscription Message
```json
{
  "type": "command",
  "payload": {
    "command": "subscribe",
    "gameStateId": "<your-game-id>"
  }
}
```

### Broadcast Event Types
- `STATE_UPDATED` - Full or partial game state update
- `TIME_ADVANCED` - In-game time progression notification
- `CHARACTER_UPDATED` - Qi, skill, or breakthrough change
- `INVESTIGATION_UPDATED` - Objective progress or lead state change
- `CLUE_DISCOVERED` - New clue unlocked
- `ACTION_RESOLVED` - Action roll outcome and applied effects
- `NPC_RELATIONSHIP_UPDATED` - NPC attitude change & milestone unlocks
- `FACTION_STANDING_UPDATED` - Faction standing tier update

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit tests
npm test

# Run type check
npm run type-check

# Run linter
npm run lint
```
