import { App } from './app';
import { logger } from './utils/logger';

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
    process.exit(1);
});

const app = new App();
app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});
