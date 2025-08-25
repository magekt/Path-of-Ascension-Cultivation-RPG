# Path of Ascension API

A comprehensive backend API for the Path of Ascension cultivation RPG game, built with Node.js, TypeScript, and MongoDB.

## 🚀 Features

- **Real-time Game State Management** - WebSocket-based real-time updates
- **Investigation System** - Complex mystery-solving mechanics
- **Character Progression** - Cultivation stages, skills, and artifacts
- **Secure Authentication** - JWT-based auth with rate limiting
- **Comprehensive Validation** - Input sanitization and schema validation
- **Production Ready** - Docker support, monitoring, and logging

## 🏗️ Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware
├── models/          # MongoDB schemas
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── validation/      # Input validation schemas
└── tests/           # Test suites
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis (optional, for caching)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd path-of-ascension-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   
   # Or use your local MongoDB installation
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Check service health**
   ```bash
   curl http://localhost:3000/health
   ```

## 📚 API Documentation

### Authentication

All API endpoints require authentication via JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Game State Management

- `POST /api/game-states/games` - Create new game
- `GET /api/game-states/games/:id/state` - Get game state
- `POST /api/game-states/games/:id/advance-time` - Advance game time
- `GET /api/game-states/games/:id/health` - Get game health status
- `DELETE /api/game-states/games/:id` - Delete game

#### Investigation System

- `POST /api/investigations` - Create investigation
- `PATCH /api/investigations/:id/progress` - Update progress
- `GET /api/investigations/:id/leads` - Get active leads

#### Health Checks

- `GET /health` - Application health status
- `GET /ready` - Readiness probe

### WebSocket Events

Connect to WebSocket at `/ws?gameStateId=<game-id>`

**Incoming Events:**
- `STATE_UPDATED` - Game state changed
- `TIME_ADVANCED` - Game time progressed
- `CHARACTER_UPDATED` - Character progression
- `INVESTIGATION_UPDATED` - Investigation progress

**Outgoing Commands:**
```json
{
  "type": "command",
  "payload": {
    "command": "subscribe",
    "gameStateId": "uuid"
  }
}
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests** - Individual service and utility testing
- **Integration Tests** - Full API endpoint testing
- **WebSocket Tests** - Real-time communication testing

## 🔒 Security Features

- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - Configurable request limits
- **CORS Protection** - Cross-origin request security
- **Helmet.js** - Security headers
- **JWT Authentication** - Secure token-based auth
- **Input Sanitization** - XSS protection

## 📊 Monitoring & Logging

### Health Monitoring

The API provides comprehensive health checks:

```bash
curl http://localhost:3000/health
```

Response includes:
- Application status
- Database connectivity
- Memory usage
- WebSocket connections
- Uptime statistics

### Logging

Structured logging with Winston:

- **Development** - Console output with colors
- **Production** - JSON format for log aggregation
- **Log Levels** - Error, Warn, Info, Debug

### Metrics

- Request/response times
- Error rates
- WebSocket connection counts
- Database query performance

## 🚀 Deployment

### Environment Variables

Key configuration options:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/path-of-ascension
JWT_SECRET=your-super-secure-secret
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com
```

### Production Checklist

- [ ] Set secure JWT secret
- [ ] Configure CORS origins
- [ ] Set up MongoDB replica set
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates
- [ ] Configure monitoring alerts
- [ ] Set up log aggregation
- [ ] Configure backup strategy

### Docker Production

```bash
# Build production image
docker build -t path-of-ascension-api .

# Run with production settings
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/path-of-ascension \
  -e JWT_SECRET=your-production-secret \
  path-of-ascension-api
```

## 🔧 Development

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format
```

### Git Hooks

Pre-commit hooks ensure code quality:
- ESLint validation
- Prettier formatting
- Type checking
- Test execution

### Database Migrations

```bash
# Create migration
npm run migration:create <name>

# Run migrations
npm run migration:up

# Rollback migration
npm run migration:down
```

## 📈 Performance

### Optimization Features

- **Connection Pooling** - MongoDB connection optimization
- **Request Compression** - Gzip compression
- **Caching** - Redis-based caching layer
- **WebSocket Heartbeat** - Connection health monitoring
- **Database Indexing** - Optimized query performance

### Performance Monitoring

- Response time tracking
- Memory usage monitoring
- Database query analysis
- WebSocket connection metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Maintain 80%+ test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check this README and inline code comments
- **Issues** - Report bugs via GitHub issues
- **Discussions** - Use GitHub discussions for questions

---

**Built with ❤️ for the cultivation RPG community**