import { GameState, GameStateOptions } from '../types/game-state';
import { GameStateModel } from '../models/GameState';
import { CharacterModel } from '../models/Character';

export class GameStateService {
    public async createGameState(options: GameStateOptions = {}): Promise<string> {
        const id = crypto.randomUUID();
        const currentTime = options.initialTime || "2025-06-09 16:41:01";
        
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
        return id;
    }

    public async getGameState(id: string): Promise<GameState> {
        const gameState = await GameStateModel.findOne({ id });
        if (!gameState) {
            throw new Error('Game state not found');
        }
        return gameState;
    }

    public async advanceTime(gameStateId: string, hours: number): Promise<void> {
        const gameState = await this.getGameState(gameStateId);
        
        // Update game time
        const currentDate = new Date(gameState.currentTime);
        currentDate.setHours(currentDate.getHours() + hours);
        gameState.currentTime = currentDate.toISOString();
        gameState.lastUpdated = new Date().toISOString();

        // Process time-based events
        await this.processTimeEvents(gameState);
        
        await gameState.save();
    }

    private async processTimeEvents(gameState: GameState): Promise<void> {
        // Process cultivation ticks
        for (const [charId, character] of gameState.characters) {
            await this.processCultivationTick(character);
        }

        // Update investigation timers
        for (const [invId, investigation] of gameState.activeInvestigations) {
            if (investigation.timeRemaining > 0) {
                investigation.timeRemaining--;
            }
        }

        // Process global events
        this.processGlobalEvents(gameState);
    }

    private async processCultivationTick(character: Character): Promise<void> {
        // Basic Qi regeneration
        const baseQiGain = 1;
        let totalQiGain = baseQiGain;

        // Apply effects
        character.activeEffects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                if (mod.type === "Qi") {
                    totalQiGain += mod.value;
                }
            });
        });

        // Update character Qi
        character.qi.current = Math.min(
            character.qi.current + totalQiGain,
            character.qi.max
        );

        // Save character updates
        if (character instanceof CharacterModel) {
            await character.save();
        }
    }
}
