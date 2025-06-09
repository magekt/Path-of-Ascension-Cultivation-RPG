export const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
    },
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/path-of-ascension',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h',
    },
    websocket: {
        path: '/ws',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    }
};
