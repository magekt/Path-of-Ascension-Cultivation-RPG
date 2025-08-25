import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from './config';

export async function connectDatabase(): Promise<void> {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0
        };

        await mongoose.connect(config.db.uri, options);
        
        logger.info('Successfully connected to MongoDB', {
            host: mongoose.connection.host,
            name: mongoose.connection.name
        });

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw new Error(`Database connection failed: ${error.message}`);
    }
}

export async function disconnectDatabase(): Promise<void> {
    try {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, closing database connection...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, closing database connection...');
    await disconnectDatabase();
    process.exit(0);
});