import { GameStateService } from '../../services/GameStateService';
import { ValidationError, NotFoundError } from '../../types/errors';

describe('GameStateService', () => {
    let gameStateService: GameStateService;

    beforeEach(() => {
        gameStateService = new GameStateService();
    });

    describe('createGameState', () => {
        it('should create a new game state with default values', async () => {
            const id = await gameStateService.createGameState();
            const gameState = await gameStateService.getGameState(id);
            
            expect(gameState).toBeDefined();
            expect(gameState.timeMultiplier).toBe(1);
            expect(gameState.characters.size).toBe(0);
        });

        it('should validate input options', async () => {
            await expect(gameStateService.createGameState({
                timeMultiplier: -1
            })).rejects.toThrow(ValidationError);
        });
    });

    describe('advanceTime', () => {
        it('should advance time correctly', async () => {
            const id = await gameStateService.createGameState();
            await gameStateService.advanceTime(id, 5);
            
            const gameState = await gameStateService.getGameState(id);
            const initialTime = new Date("2025-06-09 17:03:17");
            const expectedTime = new Date(initialTime.getTime() + 5 * 60 * 60 * 1000);
            
            expect(new Date(gameState.currentTime)).toEqual(expectedTime);
        });

        it('should throw NotFoundError for invalid game state', async () => {
            await expect(gameStateService.advanceTime(
                'invalid-id',
                5
            )).rejects.toThrow(NotFoundError);
        });
    });
});
