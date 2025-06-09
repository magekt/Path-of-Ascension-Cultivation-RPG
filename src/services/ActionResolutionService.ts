// Complete implementation of the Action Resolution Service
import { Action } from '../types/action';
import { Character } from '../types/core';
import { GameState } from '../types/game-state';
import { ValidationError } from '../types/errors';
import { logger } from '../utils/logger';
import { WebSocketService } from './WebSocketService';

export class ActionResolutionService {
    private webSocketService: WebSocketService;
    private readonly BASE_SUCCESS_CHANCE = 60;
    private readonly MAX_SUCCESS_CHANCE = 95;
    private readonly MIN_SUCCESS_CHANCE = 5;

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService;
    }

    public async resolveAction(
        action: Action,
        character: Character,
        gameState: GameState
    ): Promise<{
        success: boolean;
        effects: any[];
        messages: string[];
    }> {
        try {
            // Validate cooldown
            if (!this.checkCooldown(action)) {
                throw new ValidationError('Action is on cooldown');
            }

            // Check requirements
            if (!this.checkRequirements(action, character)) {
                throw new ValidationError('Requirements not met for action');
            }

            // Calculate success chance
            const successChance = this.calculateSuccessChance(action, character);
            const roll = Math.random() * 100;
            const success = roll <= successChance;

            // Apply outcomes
            const effects = success ? action.outcomes.success : action.outcomes.failure;
            await this.applyEffects(effects, character, gameState);

            // Update action cooldown
            action.lastUsed = "2025-06-09 17:09:35";

            // Notify via WebSocket
            this.webSocketService.broadcastEvent({
                type: 'ACTION_RESOLVED',
                gameStateId: gameState.id,
                timestamp: "2025-06-09 17:09:35",
                data: {
                    actionId: action.id,
                    characterId: character.id,
                    success,
                    effects
                }
            });

            return {
                success,
                effects,
                messages: this.generateActionMessages(action, success, effects)
            };
        } catch (error) {
            logger.error('Action resolution error', {
                actionId: action.id,
                characterId: character.id,
                error: error.message
            });
            throw error;
        }
    }

    private checkCooldown(action: Action): boolean {
        if (!action.cooldown || !action.lastUsed) return true;
        
        const lastUsed = new Date(action.lastUsed);
        const now = new Date("2025-06-09 17:09:35");
        const hoursDiff = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
        
        return hoursDiff >= action.cooldown;
    }

    private checkRequirements(action: Action, character: Character): boolean {
        return action.requirements.every(req => {
            switch (req.type) {
                case 'Qi':
                    return character.qi.current >= req.value;
                case 'Skill':
                    const skill = character.skills.find(s => s.name === req.value);
                    return skill && skill.level >= req.value;
                case 'Standing':
                    return character.sectStanding >= req.value;
                case 'Resource':
                    // Would need to check character's inventory/resources
                    return true; // Implement resource checking
                default:
                    return false;
            }
        });
    }

    private calculateSuccessChance(action: Action, character: Character): number {
        let baseChance = this.BASE_SUCCESS_CHANCE;

        // Modify based on character skills
        character.skills.forEach(skill => {
            if (skill.type === action.type) {
                baseChance += (skill.level * 5);
            }
        });

        // Apply effects
        character.activeEffects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                if (mod.type === action.type) {
                    baseChance += mod.value;
                }
            });
        });

        return Math.min(this.MAX_SUCCESS_CHANCE, 
                       Math.max(this.MIN_SUCCESS_CHANCE, baseChance));
    }

    private async applyEffects(
        effects: any[],
        character: Character,
        gameState: GameState
    ): Promise<void> {
        for (const effect of effects) {
            effect.modifiers.forEach(mod => {
                switch (mod.type) {
                    case 'Qi':
                        character.qi.current = Math.min(
                            character.qi.current + mod.value,
                            character.qi.max
                        );
                        break;
                    case 'Standing':
                        character.sectStanding = Math.min(
                            character.sectStanding + mod.value,
                            5
                        );
                        break;
                    case 'Skill':
                        const skill = character.skills.find(s => s.name === mod.skillName);
                        if (skill) {
                            skill.level += mod.value;
                        }
                        break;
                }
            });
        }

        // Save character changes
        if (character instanceof mongoose.Model) {
            await character.save();
        }
    }

    private generateActionMessages(
        action: Action,
        success: boolean,
        effects: any[]
    ): string[] {
        const messages = [];
        
        messages.push(success ? 
            `Successfully completed: ${action.description}` :
            `Failed to complete: ${action.description}`
        );

        effects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                messages.push(`${mod.type} changed by ${mod.value}`);
            });
        });

        return messages;
    }
}
