import { GameState, GameStateOptions, Event } from '../types/game-state';
import { Character, CultivationStage } from '../types/core';
import { GameStateModel } from '../models/GameState';
import { CharacterModel } from '../models/Character';
import { ValidationError, NotFoundError } from '../types/errors';
import { gameStateSchema } from '../validation/schemas';
import { WebSocketService } from './WebSocketService';
import { logger } from '../utils/logger';

export class GameStateService {
    private webSocketService: WebSocketService;
    private readonly INITIAL_TIME = "2025-06-09 17:07:26";
    private readonly MAX_TIME_ADVANCE = 24; // Maximum hours to advance at once
    private readonly MIN_QI_REGEN = 1; // Minimum Qi regeneration per hour

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService;
    }

    public async createGameState(options: GameStateOptions = {}): Promise<string> {
        try {
            // Validate input
            await gameStateSchema.validate(options, { abortEarly: false });

            const id = crypto.randomUUID();
            const currentTime = options.initialTime || this.INITIAL_TIME;
            
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
                    await this.validateCharacter(character);
                    await character.save();
                    gameState.characters.set(character.id, character);
                }
            }

            await gameState.save();
            
            this.webSocketService.broadcastEvent({
                type: 'STATE_UPDATED',
                gameStateId: id,
                timestamp: currentTime,
                data: { action: 'created' }
            });

            logger.info('Created new game state', { gameStateId: id });
            return id;
        } catch (error) {
            logger.error('Error creating game state', { error });
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
        if (!Number.isInteger(hours) || hours <= 0 || hours > this.MAX_TIME_ADVANCE) {
            throw new ValidationError(`Hours must be a positive integer <= ${this.MAX_TIME_ADVANCE}`);
        }

        const gameState = await this.getGameState(gameStateId);
        
        try {
            // Update game time
            const currentDate = new Date(gameState.currentTime);
            currentDate.setHours(currentDate.getHours() + hours);
            gameState.currentTime = currentDate.toISOString();
            gameState.lastUpdated = new Date().toISOString();

            // Process time-based events
            await this.processTimeEvents(gameState, hours);
            
            await gameState.save();

            this.webSocketService.broadcastEvent({
                type: 'TIME_ADVANCED',
                gameStateId,
                timestamp: gameState.currentTime,
                data: {
                    previousTime: currentDate.toISOString(),
                    newTime: gameState.currentTime,
                    hoursPassed: hours
                }
            });

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

    private async processTimeEvents(gameState: GameState, hours: number): Promise<void> {
        // Process cultivation ticks for all characters
        const characterUpdates = await Promise.all(
            Array.from(gameState.characters.values()).map(char =>
                this.processCultivationTick(char, hours)
            )
        );

        // Update character states
        characterUpdates.forEach(char => {
            gameState.characters.set(char.id, char);
        });

        // Update investigation timers
        for (const [invId, investigation] of gameState.activeInvestigations) {
            if (investigation.timeRemaining > 0) {
                investigation.timeRemaining = Math.max(0, investigation.timeRemaining - hours);
                if (investigation.timeRemaining === 0) {
                    await this.handleInvestigationCompletion(gameState, invId);
                }
            }
        }

        // Process global events
        this.processGlobalEvents(gameState, hours);

        // Check for breakthrough opportunities
        await this.checkBreakthroughs(gameState);
    }

    private async processCultivationTick(character: Character, hours: number): Promise<Character> {
        // Calculate base Qi regeneration
        let totalQiGain = this.MIN_QI_REGEN * hours;

        // Apply cultivation stage modifiers
        totalQiGain *= this.getCultivationStageModifier(character.cultivationStage);

        // Apply active effects
        character.activeEffects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                if (mod.type === "Qi") {
                    totalQiGain += mod.value * hours;
                }
            });
        });

        // Update character Qi
        character.qi.current = Math.min(
            character.qi.current + totalQiGain,
            character.qi.max
        );

        // Process cultivation progress
        await this.updateCultivationProgress(character, hours);

        // Remove expired effects
        character.activeEffects = character.activeEffects.filter(effect => {
            if (!effect.duration) return true;
            return effect.duration > hours;
        });

        // Save character updates
        if (character instanceof CharacterModel) {
            await character.save();
        }

        this.webSocketService.broadcastEvent({
            type: 'CHARACTER_UPDATED',
            gameStateId: character.gameStateId,
            timestamp: new Date().toISOString(),
            data: {
                characterId: character.id,
                qiGain: totalQiGain,
                newQi: character.qi.current
            }
        });

        return character;
    }

    private getCultivationStageModifier(stage: CultivationStage): number {
        // Higher cultivation stages regenerate Qi faster
        return 1 + (stage.level * 0.1);
    }

    private async updateCultivationProgress(character: Character, hours: number): Promise<void> {
        const baseProgress = 0.1 * hours; // Base progress per hour
        let totalProgress = baseProgress;

        // Apply modifiers from active effects
        character.activeEffects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                if (mod.type === "CultivationSpeed") {
                    totalProgress *= (1 + mod.value);
                }
            });
        });

        // Update progress
        character.cultivationStage.progress += totalProgress;

        // Check for breakthrough
        if (character.cultivationStage.progress >= 100) {
            await this.initiateBreakthrough(character);
        }
    }

    private async initiateBreakthrough(character: Character): Promise<void> {
        // Reset progress and increase level
        character.cultivationStage.progress = 0;
        character.cultivationStage.level++;

        // Increase Qi capacity
        character.qi.max *= 1.2;

        this.webSocketService.broadcastEvent({
            type: 'CHARACTER_UPDATED',
            gameStateId: character.gameStateId,
            timestamp: new Date().toISOString(),
            data: {
                characterId: character.id,
                breakthrough: true,
                newLevel: character.cultivationStage.level,
                newQiMax: character.qi.max
            }
        });
    }

    private async handleInvestigationCompletion(gameState: GameState, investigationId: string): Promise<void> {
        const investigation = gameState.activeInvestigations.get(investigationId);
        if (!investigation) return;

        // Process investigation completion
        this.webSocketService.broadcastEvent({
            type: 'INVESTIGATION_UPDATED',
            gameStateId: gameState.id,
            timestamp: new Date().toISOString(),
            data: {
                investigationId,
                status: 'completed',
                results: investigation.results
            }
        });

        // Remove completed investigation
        gameState.activeInvestigations.delete(investigationId);
    }

    private processGlobalEvents(gameState: GameState, hours: number): void {
        // Remove expired events
        gameState.globalEvents = gameState.globalEvents.filter(event => {
            if (!event.duration) return true;
            return event.duration > hours;
        });

        // Process active event effects
        gameState.globalEvents.forEach(event => {
            this.applyEventEffects(gameState, event);
        });
    }

    private applyEventEffects(gameState: GameState, event: Event): void {
        event.effects.forEach(effect => {
            // Apply global effects to all characters
            if (effect.scope === 'global') {
                gameState.characters.forEach(char => {
                    char.activeEffects.push({
                        ...effect,
                        source: event.id
                    });
                });
            }
        });
    }

    private async checkBreakthroughs(gameState: GameState): Promise<void> {
        const characters = Array.from(gameState.characters.values());
        for (const char of characters) {
            if (this.isBreakthroughReady(char)) {
                await this.initiateBreakthrough(char);
            }
        }
    }

    private isBreakthroughReady(character: Character): boolean {
        return character.qi.current >= character.qi.max &&
               character.cultivationStage.progress >= 95;
    }

    private async validateCharacter(character: Character): Promise<void> {
        if (character.qi.current > character.qi.max) {
            throw new ValidationError('Current Qi cannot exceed maximum Qi');
        }

        if (character.cultivationStage.progress < 0 || character.cultivationStage.progress > 100) {
            throw new ValidationError('Cultivation progress must be between 0 and 100');
        }

        // Additional validation as needed
    }
}
