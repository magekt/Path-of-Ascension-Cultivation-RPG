// Main application setup
import express from 'express';
import http from 'http';
import { GameStateController } from './controllers/GameStateController';
import { WebSocketService } from './services/WebSocketService';
import { errorHandler } from './middleware/error';
import { connectDatabase } from './config/database';
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
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeControllers(): void {
        const gameStateController = new GameStateController(this.webSocketService);
        this.app.use('/api/game-states', gameStateController.getRouter());
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            await connectDatabase();
            const port = process.env.PORT || 3000;
            this.server.listen(port, () => {
                logger.info(`Server is running on port ${port}`);
            });
        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Start the application
if (require.main === module) {
    const app = new App();
    app.start();
}
