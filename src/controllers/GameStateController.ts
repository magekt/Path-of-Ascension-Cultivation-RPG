import { Router } from 'express';
import { GameStateService } from '../services/GameStateService';
import { ActionResolutionService } from '../services/ActionResolutionService';

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
        this.router.post('/games', this.createGame);
        this.router.post('/games/:id/advance-time', this.advanceTime);
        this.router.get('/games/:id/state', this.getGameState);
    }

    private createGame = async (req, res) => {
        try {
            const id = this.gameStateService.createGameState(req.body);
            res.status(201).json({ id });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    private advanceTime = async (req, res) => {
        try {
            this.gameStateService.advanceTime(
                req.params.id,
                req.body.hours
            );
            res.status(204).send();
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    private getGameState = async (req, res) => {
        try {
            const gameState = this.gameStateService.getGameState(req.params.id);
            res.json(gameState);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    public getRouter(): Router {
        return this.router;
    }
}
