# AGENTS.md - Developer & AI Agent Guidelines

## Overview

Welcome to the **Path of Ascension API** repository. This project is a TypeScript Node.js backend providing RESTful APIs and real-time WebSocket communication for a menu-driven cultivation RPG game.

---

## Technical Stack

- **Language / Runtime:** TypeScript 5.1+, Node.js (>= 18.0.0)
- **Framework:** Express.js 4.18+
- **Database:** MongoDB 6.0+ with Mongoose 7.5+
- **Real-Time:** WebSockets (`ws` 8.13+)
- **Validation & Auth:** Yup schemas, JWT (`jsonwebtoken`), `bcryptjs`
- **Logging & Security:** Winston logger, Helmet.js, CORS, Express Rate Limit, Gzip Compression
- **Testing:** Jest (`ts-jest`), Supertest, `mongodb-memory-server`

---

## Directory & File Structure

```
.
├── src/
│   ├── app.ts                  # App class setup (express, server, middleware, routes, health)
│   ├── index.ts                # Application process entrypoint & process error hooks
│   ├── config/
│   │   ├── config.ts           # Global application configuration & env variable mapping
│   │   └── database.ts         # Mongoose connection and disconnection logic
│   ├── controllers/
│   │   ├── GameStateController.ts  # Express endpoints for game state management
│   │   └── InvestigationController.ts # Express endpoints for investigations & leads
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   ├── error.ts            # Centralized Express error handler
│   │   └── validation.ts       # Security & Yup schema validation middleware
│   ├── models/
│   │   ├── Character.ts        # Character Mongoose schema & methods
│   │   ├── GameState.ts        # GameState Mongoose schema
│   │   └── Investigation.ts    # Investigation Mongoose schema
│   ├── services/
│   │   ├── ActionResolutionService.ts # Game action resolution rules engine
│   │   ├── GameStateService.ts        # Core business logic for GameState CRUD & time advance
│   │   ├── InvestigationService.ts    # Investigation progress & clue mechanics
│   │   └── WebSocketService.ts        # WS client connection manager & event broadcasting
│   ├── types/
│   │   ├── action.ts           # Game action interface definitions
│   │   ├── core.ts             # Character, CultivationStage, Skill, Artifact, Effect types
│   │   ├── errors.ts           # Custom AppError classes
│   │   ├── events.ts           # WebSocket event payload & message definitions
│   │   ├── game-state.ts       # GameState, GameSettings, GameStatus, Event types
│   │   └── investigation.ts    # Investigation, SubObjective, Clue, Lead, Reward types
│   ├── utils/
│   │   ├── logger.ts           # Winston logger instance configuration
│   │   └── timestamp.ts        # Timestamp utility functions
│   ├── validation/
│   │   └── schemas.ts          # Yup validation schemas for API inputs
│   └── tests/
│       ├── integration/        # Supertest API endpoint integration tests
│       ├── services/           # Unit tests for domain services
│       └── setup.ts            # Jest setup & mongodb-memory-server test database lifecycle
├── Dockerfile                  # Production container build
├── docker-compose.yml          # Local container orchestration
├── package.json                # Project dependencies and script definitions
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Commands & Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with `nodemon` and `ts-node` |
| `npm run build` | Clean and compile TypeScript to `dist/` |
| `npm start` | Run compiled production code from `dist/index.js` |
| `npm run type-check` | Run `tsc --noEmit` to verify type safety |
| `npm test` | Execute Jest test runner |
| `npm run test:watch` | Execute Jest in interactive watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint checks across `src/**/*.ts` |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code using Prettier |

---

## Coding Standards & Development Guidelines

1. **Type Safety & Strictness:**
   - Always define strict types or interfaces for function parameters and return types.
   - Reuse types defined in `src/types/` whenever possible.
   - Do not use `any` unless absolutely necessary or handling unpredictable external dynamic inputs.

2. **Error Handling:**
   - Throw custom `AppError` subclasses from `src/types/errors.ts` (`ValidationError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`).
   - Allow Express routes and services to handle errors through `next(error)` or the centralized `errorHandler` in `src/middleware/error.ts`.

3. **Logging:**
   - Use `logger.info()`, `logger.warn()`, `logger.error()`, and `logger.debug()` from `src/utils/logger`.
   - Avoid standard `console.log()` calls in application code.

4. **Real-time Event Broadcasting:**
   - Whenever game states or investigation states are mutated via API controllers or services, trigger appropriate WebSocket events via `WebSocketService` (`STATE_UPDATED`, `TIME_ADVANCED`, `CHARACTER_UPDATED`, `INVESTIGATION_UPDATED`).

5. **Testing Requirements:**
   - Before completing any task, ensure that `npm run type-check` and `npm test` pass.
   - For new endpoints or service features, write unit tests under `src/tests/services/` or integration tests under `src/tests/integration/`.

---

## Environment Variables Configuration

Refer to `.env.example` when configuring runtime environment variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/path-of-ascension
JWT_SECRET=your-super-secure-secret-key-change-in-production
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000
```
