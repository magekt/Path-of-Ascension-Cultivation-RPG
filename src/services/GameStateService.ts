import { GameState, GameStateOptions } from '../types/game-state';
import { GameStateModel } from '../models/GameState';
import { CharacterModel } from '../models/Character';
import { ValidationError, NotFoundError } from '../types/errors';
import { gameStateSchema } from '../validation/schemas';
import { logger } from '../utils/logger';

export class GameStateService {
    public async createGameState(options: GameStateOptions = {}): Promise<string> {
        try {
            // Validate input
            await gameStateSchema.validate(options, { abortEarly: false });

            const id = crypto.randomUUID();
            const currentTime = options.initialTime || "2025-06-09 16:44:47";
            
            const gameState = new GameStateModel({
                id,
                createdAt: currentTime,
                lastUpdated: currentTime,
                currentTime,
                characters: new Map(),
                activeInvestigations: new Map(),
                globalEvents: [],
                timeMultiplier: options.timeMultiplier || 1
            });

            if (options.characters) {
                for (const char of options.characters) {
                    const character = new CharacterModel(char);
                    await character.save();
                    gameState.characters.set(character.id, character);
                }
            }

            await gameState.save();
            logger.info('Created new game state', { gameStateId: id });
            return id;
        } catch (error) {
            if (error.name === 'ValidationError') {
                throw new ValidationError('Invalid game state options', error.errors);
            }
            throw error;
        }
    }

    public async getGameState(id: string): Promise<GameState> {
        const gameState = await GameStateModel.findOne({ id });
        if (!gameState) {
            throw new NotFoundError(`Game state not found: ${id}`);
        }
        return gameState;
    }

    public async advanceTime(gameStateId: string, hours: number): Promise<void> {
        if (!Number.isInteger(hours) || hours < 0) {
            throw new ValidationError('Hours must be a positive integer');
        }

        const gameState = await this.getGameState(gameStateId);
        
        try {
            // Update game time
            const currentDate = new Date(gameState.currentTime);
            currentDate.setHours(currentDate.getHours() + hours);
            gameState.currentTime = currentDate.toISOString();
            gameState.lastUpdated = new Date().toISOString();

            // Process time-based events
            await this.processTimeEvents(gameState);
            
            await gameState.save();
            logger.info('Advanced game time', { 
                gameStateId, 
                hours, 
                newTime: gameState.currentTime 
            });
        } catch (error) {
            logger.error('Error advancing time', {
                gameStateId,
                hours,
                error: error.message
            });
            throw error;
        }
    }
}
