// Main application setup
import express from 'express';
import http from 'http';
import cors from 'cors';
import { GameStateController } from './controllers/GameStateController';
import { InvestigationController } from './controllers/InvestigationController';
import { WebSocketService } from './services/WebSocketService';
import { errorHandler } from './middleware/error';
import { securityMiddleware } from './middleware/validation';
import { connectDatabase } from './config/database';
import { config } from './config/config';
import { logger } from './utils/logger';

export class App {
    private app: express.Application;
    private server: http.Server;
    private webSocketService: WebSocketService;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.webSocketService = new WebSocketService(this.server);
        this.initializeMiddlewares();
        this.initializeControllers();
        this.initializeHealthChecks();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(securityMiddleware);
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            logger.info('Request received', {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    private initializeControllers(): void {
        const gameStateController = new GameStateController(this.webSocketService);
        const investigationController = new InvestigationController(this.webSocketService);
        
        this.app.use('/api/game-states', gameStateController.getRouter());
        this.app.use('/api/investigations', investigationController.getRouter());
        
        // API info endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                name: config.app.name,
                version: config.app.version,
                environment: config.app.env,
                timestamp: new Date().toISOString()
            });
        });
    }

    private initializeHealthChecks(): void {
        this.app.get('/health', async (req, res) => {
            try {
                // Check database connection
                const mongoose = require('mongoose');
                const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
                
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    database: dbStatus,
                    websocket: {
                        connections: this.webSocketService.getConnectionCount()
                    }
                };
                
                res.json(health);
            } catch (error) {
                logger.error('Health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        this.app.get('/ready', async (req, res) => {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1) {
                res.json({ status: 'ready' });
            } else {
                res.status(503).json({ status: 'not ready' });
            }
        });
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
        
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            await connectDatabase();
            const port = config.app.port;
            this.server.listen(port, () => {
                logger.info('Server started successfully', {
                    port,
                    environment: config.app.env,
                    name: config.app.name,
                    version: config.app.version
                });
            });
        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        try {
            logger.info('Shutting down server...');
            this.server.close();
            await require('./config/database').disconnectDatabase();
            logger.info('Server shutdown complete');
        } catch (error) {
            logger.error('Error during shutdown:', error);
            throw error;
        }
    }
}

// Start the application
if (require.main === module) {
    const app = new App();
    app.start();
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        await app.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', async () => {
        logger.info('SIGINT received, shutting down gracefully');
        await app.stop();
        process.exit(0);
    });
}
