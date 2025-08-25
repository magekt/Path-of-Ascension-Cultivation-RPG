import { Router } from 'express';
import { GameStateService } from '../services/GameStateService';
import { ActionResolutionService } from '../services/ActionResolutionService';
import { WebSocketService } from '../services/WebSocketService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest, apiRateLimit } from '../middleware/validation';
import { gameStateSchema, advanceTimeSchema } from '../validation/schemas';
import { logger } from '../utils/logger';

export class GameStateController {
    private router: Router;
    private gameStateService: GameStateService;
    private actionResolutionService: ActionResolutionService;

    constructor(webSocketService: WebSocketService) {
        this.router = Router();
        this.gameStateService = new GameStateService(webSocketService);
        this.actionResolutionService = new ActionResolutionService(webSocketService);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Apply auth middleware to all routes
        this.router.use(authMiddleware);
        this.router.use(apiRateLimit);
        
        this.router.post('/games', validateRequest(gameStateSchema), this.createGame);
        this.router.post('/games/:id/advance-time', validateRequest(advanceTimeSchema), this.advanceTime);
        this.router.get('/games/:id/state', this.getGameState);
        this.router.get('/games/:id/health', this.getGameHealth);
        this.router.delete('/games/:id', this.deleteGame);
    }

    private createGame = async (req: AuthRequest, res: any) => {
        try {
            logger.info('Creating new game', { userId: req.user?.id });
            const id = await this.gameStateService.createGameState({
                ...req.body,
                createdBy: req.user?.id
            });
            res.status(201).json({ 
                id,
                message: 'Game created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Create game error:', { 
                userId: req.user?.id, 
                error: error.message 
            });
            res.status(400).json({ error: error.message });
        }
    };

    private advanceTime = async (req: AuthRequest, res: any) => {
        try {
            logger.info('Advancing game time', { 
                gameId: req.params.id, 
                hours: req.body.hours,
                userId: req.user?.id 
            });
            await this.gameStateService.advanceTime(
                req.params.id,
                req.body.hours
            );
            res.status(200).json({
                message: 'Time advanced successfully',
                hours: req.body.hours,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Advance time error:', { 
                gameId: req.params.id, 
                error: error.message 
            });
            res.status(404).json({ error: error.message });
        }
    };

    private getGameState = async (req: AuthRequest, res: any) => {
        try {
            const gameState = await this.gameStateService.getGameState(req.params.id);
            res.json({
                gameState,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Get game state error:', { 
                gameId: req.params.id, 
                error: error.message 
            });
            res.status(404).json({ error: error.message });
        }
    };

    private getGameHealth = async (req: AuthRequest, res: any) => {
        try {
            const health = await this.gameStateService.getGameHealth(req.params.id);
            res.json({
                health,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Get game health error:', { 
                gameId: req.params.id, 
                error: error.message 
            });
            res.status(404).json({ error: error.message });
        }
    };
    public getRouter(): Router {
        return this.router;
    }
}

    private deleteGame = async (req: AuthRequest, res: any) => {
        try {
            await this.gameStateService.deleteGameState(req.params.id, req.user?.id);
            res.status(200).json({
                message: 'Game deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Delete game error:', { 
                gameId: req.params.id, 
                error: error.message 
            });
            res.status(404).json({ error: error.message });
        }
    };