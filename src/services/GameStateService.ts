import { GameState, GameStateOptions, Event } from '../types/game-state';
import { Character } from '../types/core';

export class GameStateService {
    private gameStates: Map<string, GameState>;
    
    constructor() {
        this.gameStates = new Map();
    }

    public createGameState(options: GameStateOptions = {}): string {
        const id = crypto.randomUUID();
        const currentTime = options.initialTime || "2025-06-09 16:38:42";
        
        const gameState: GameState = {
            id,
            createdAt: currentTime,
            lastUpdated: currentTime,
            currentTime,
            characters: new Map(),
            activeInvestigations: new Map(),
            globalEvents: [],
            timeMultiplier: options.timeMultiplier || 1
        };

        if (options.characters) {
            options.characters.forEach(char => {
                gameState.characters.set(char.id, char);
            });
        }

        this.gameStates.set(id, gameState);
        return id;
    }

    public advanceTime(
        gameStateId: string,
        hours: number
    ): void {
        const gameState = this.gameStates.get(gameStateId);
        if (!gameState) {
            throw new Error('Game state not found');
        }

        // Update game time
        const currentDate = new Date(gameState.currentTime);
        currentDate.setHours(currentDate.getHours() + hours);
        gameState.currentTime = currentDate.toISOString();
        gameState.lastUpdated = new Date().toISOString();

        // Process time-based events
        this.processTimeEvents(gameState);
    }

    private processTimeEvents(gameState: GameState): void {
        // Process cultivation ticks
        gameState.characters.forEach(character => {
            this.processCultivationTick(character);
        });

        // Update investigation timers
        gameState.activeInvestigations.forEach(investigation => {
            if (investigation.timeRemaining > 0) {
                investigation.timeRemaining--;
            }
        });

        // Process global events
        this.processGlobalEvents(gameState);
    }

    private processCultivationTick(character: Character): void {
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
    }

    private processGlobalEvents(gameState: GameState): void {
        // Remove expired events
        gameState.globalEvents = gameState.globalEvents.filter(event => {
            if (!event.duration) return true;
            const eventTime = new Date(event.timestamp);
            const currentTime = new Date(gameState.currentTime);
            const hoursDiff = (currentTime.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
            return hoursDiff < event.duration;
        });
    }
}
