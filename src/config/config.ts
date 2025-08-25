export const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        name: 'Path of Ascension API',
        version: '1.0.0'
    },
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/path-of-ascension',
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || (() => {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET environment variable is required in production');
            }
            return 'development-secret-key-change-in-production';
        })(),
        expiresIn: '24h',
        issuer: 'path-of-ascension',
        audience: 'path-of-ascension-users'
    },
    websocket: {
        path: '/ws',
        heartbeatInterval: 30000,
        maxConnections: 1000
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'simple'
    },
    security: {
        bcryptRounds: 12,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
        lockoutTime: 15 * 60 * 1000 // 15 minutes
    },
    game: {
        maxCharactersPerUser: 3,
        defaultTimeMultiplier: 1,
        maxTimeAdvanceHours: 24,
        cultivationTickInterval: 60 * 60 * 1000 // 1 hour
    }
};
