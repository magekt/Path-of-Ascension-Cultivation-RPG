import mongoose from 'mongoose';
import { Action } from '../types/action';
import { Character, Effect } from '../types/core';
import { GameState } from '../types/game-state';
import { ValidationError } from '../types/errors';
import { logger } from '../utils/logger';
import { WebSocketService } from './WebSocketService';
import { RelationshipService } from './RelationshipService';

export class ActionResolutionService {
    private webSocketService: WebSocketService;
    private relationshipService?: RelationshipService;
    private readonly BASE_SUCCESS_CHANCE = 60;
    private readonly MAX_SUCCESS_CHANCE = 95;
    private readonly MIN_SUCCESS_CHANCE = 5;

    constructor(webSocketService: WebSocketService, relationshipService?: RelationshipService) {
        this.webSocketService = webSocketService;
        this.relationshipService = relationshipService;
    }

    public async resolveAction(
        action: Action,
        character: Character,
        gameState: GameState
    ): Promise<{
        success: boolean;
        effects: Effect[];
        messages: string[];
    }> {
        try {
            const nowIso = new Date().toISOString();

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
            const effects: Effect[] = success ? action.outcomes.success : action.outcomes.failure;
            await this.applyEffects(effects, character, gameState);

            // Update action cooldown
            action.lastUsed = nowIso;

            // Notify via WebSocket
            this.webSocketService.broadcastEvent({
                type: 'ACTION_RESOLVED',
                gameStateId: gameState.id,
                timestamp: nowIso,
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
                error: (error as Error).message
            });
            throw error;
        }
    }

    private checkCooldown(action: Action): boolean {
        if (!action.cooldown || !action.lastUsed) return true;
        
        const lastUsed = new Date(action.lastUsed);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
        
        return hoursDiff >= action.cooldown;
    }

    private checkRequirements(action: Action, character: Character): boolean {
        return action.requirements.every(req => {
            switch (req.type) {
                case 'Qi':
                    return character.qi.current >= req.value;
                case 'Skill':
                    const skill = character.skills.find(s => s.id === req.condition || s.name === req.condition);
                    return Boolean(skill && skill.level >= req.value);
                case 'Standing':
                    return character.sectStanding >= req.value;
                case 'Resource':
                    return true;
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

        // Apply active effects
        character.activeEffects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                if (mod.type === (action.type as string)) {
                    baseChance += mod.value;
                }
            });
        });

        return Math.min(this.MAX_SUCCESS_CHANCE, 
                       Math.max(this.MIN_SUCCESS_CHANCE, baseChance));
    }

    private async applyEffects(
        effects: Effect[],
        character: Character,
        gameState: GameState
    ): Promise<void> {
        for (const effect of effects) {
            character.activeEffects.push(effect);

            effect.modifiers.forEach(mod => {
                switch (mod.type) {
                    case 'Qi':
                        character.qi.current = Math.max(0, Math.min(
                            character.qi.current + mod.value,
                            character.qi.max
                        ));
                        break;
                    case 'Social':
                        character.sectStanding = Math.max(0, Math.min(
                            character.sectStanding + mod.value,
                            5
                        ));
                        if (this.relationshipService && mod.target) {
                            this.relationshipService.updateFactionStanding(mod.target, mod.value, gameState.id);
                        }
                        break;
                    case 'Technical':
                    case 'CultivationSpeed':
                    case 'Investigation':
                        break;
                }
            });
        }

        // Save character changes if instance of Mongoose Model
        if (character instanceof mongoose.Model) {
            await character.save();
        }
    }

    private generateActionMessages(
        action: Action,
        success: boolean,
        effects: Effect[]
    ): string[] {
        const messages: string[] = [];
        
        messages.push(success ? 
            `Successfully completed: ${action.description}` :
            `Failed to complete: ${action.description}`
        );

        effects.forEach(effect => {
            effect.modifiers.forEach(mod => {
                messages.push(`${mod.type} modified by ${mod.value}`);
            });
        });

        return messages;
    }
}
