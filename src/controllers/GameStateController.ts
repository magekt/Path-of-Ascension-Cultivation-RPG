import { Router } from 'express';
import { GameStateService } from '../services/GameStateService';
import { ActionResolutionService } from '../services/ActionResolutionService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export class GameStateController {
    private router: Router;
    private gameStateService: GameStateService;
    private actionResolutionService: ActionResolutionService;

    constructor() {
        this.router = Router();
        this.gameStateService = new GameStateService();
        this.actionResolutionService = new ActionResolutionService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Apply auth middleware to all routes
        this.router.use(authMiddleware);
        
        this.router.post('/games', this.createGame);
        this.router.post('/games/:id/advance-time', this.advanceTime);
        this.router.get('/games/:id/state', this.getGameState);
    }

    private createGame = async (req: AuthRequest, res: Response) => {
        try {
            const id = await this.gameStateService.createGameState({
                ...req.body,
                createdBy: req.user?.id
            });
            res.status(201).json({ id });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    private advanceTime = async (req: AuthRequest, res: Response) => {
        try {
            await this.gameStateService.advanceTime(
                req.params.id,
                req.body.hours
            );
            res.status(204).send();
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    private getGameState = async (req: AuthRequest, res: Response) => {
        try {
            const gameState = await this.gameStateService.getGameState(req.params.id);
            res.json(gameState);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    public getRouter(): Router {
        return this.router;
    }
}
