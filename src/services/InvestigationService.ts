import { Investigation, SubObjective, Lead, Clue } from '../types/investigation';
import { InvestigationModel } from '../models/Investigation';
import { Character } from '../types/core';
import { ValidationError, NotFoundError } from '../types/errors';
import { WebSocketService } from './WebSocketService';
import { logger } from '../utils/logger';

export class InvestigationService {
    private webSocketService: WebSocketService;

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService;
    }

    public async createInvestigation(data: Partial<Investigation>): Promise<string> {
        try {
            const id = crypto.randomUUID();
            const investigation = new InvestigationModel({
                ...data,
                id,
                createdAt: "2025-06-09 17:12:13",
                lastUpdated: "2025-06-09 17:12:13"
            });

            await investigation.save();

            this.webSocketService.broadcastEvent({
                type: 'INVESTIGATION_CREATED',
                gameStateId: data.gameStateId,
                timestamp: "2025-06-09 17:12:13",
                data: { investigationId: id }
            });

            return id;
        } catch (error) {
            logger.error('Error creating investigation', { error });
            throw error;
        }
    }

    public async updateProgress(
        investigationId: string,
        subObjectiveId: string,
        progress: number,
        character: Character
    ): Promise<void> {
        const investigation = await InvestigationModel.findOne({ id: investigationId });
        if (!investigation) {
            throw new NotFoundError('Investigation not found');
        }

        const subObjective = investigation.subObjectives.find(
            sub => sub.id === subObjectiveId
        );
        if (!subObjective) {
            throw new NotFoundError('Sub-objective not found');
        }

        subObjective.progress = Math.min(100, Math.max(0, progress));
        investigation.lastUpdated = "2025-06-09 17:12:13";

        // Check for newly discovered clues
        await this.checkClueDiscovery(investigation, subObjective, character);

        // Update main objective progress
        this.updateMainObjectiveProgress(investigation);

        await investigation.save();

        this.webSocketService.broadcastEvent({
            type: 'INVESTIGATION_UPDATED',
            gameStateId: investigation.gameStateId,
            timestamp: "2025-06-09 17:12:13",
            data: {
                investigationId,
                subObjectiveId,
                progress: subObjective.progress,
                mainProgress: investigation.mainObjective.progress
            }
        });
    }

    private async checkClueDiscovery(
        investigation: Investigation,
        subObjective: SubObjective,
        character: Character
    ): Promise<void> {
        const undiscoveredClues = subObjective.clues.filter(clue => !clue.discovered);

        for (const clue of undiscoveredClues) {
            if (this.shouldDiscoverClue(clue, subObjective.progress, character)) {
                clue.discovered = true;
                await this.handleClueDiscovery(investigation, clue);
            }
        }
    }

    private shouldDiscoverClue(
        clue: Clue,
        progress: number,
        character: Character
    ): boolean {
        // Base discovery chance on progress and character skills
        let discoveryChance = progress * 0.5;

        // Modify based on character skills
        character.skills.forEach(skill => {
            if (skill.type === 'Technical' || skill.type === 'Social') {
                discoveryChance += skill.level * 2;
            }
        });

        return Math.random() * 100 <= discoveryChance;
    }

    private async handleClueDiscovery(
        investigation: Investigation,
        clue: Clue
    ): Promise<void> {
        // Unlock connected leads
        if (clue.leadsTo) {
            clue.leadsTo.forEach(leadId => {
                const lead = investigation.activeLeads.find(l => l.id === leadId);
                if (lead && lead.status === 'Locked') {
                    lead.status = 'Unexamined';
                }
            });
        }

        this.webSocketService.broadcastEvent({
            type: 'CLUE_DISCOVERED',
            gameStateId: investigation.gameStateId,
            timestamp: "2025-06-09 17:12:13",
            data: {
                investigationId: investigation.id,
                clueId: clue.id,
                description: clue.description,
                unlockedLeads: clue.leadsTo
            }
        });
    }

    private updateMainObjectiveProgress(investigation: Investigation): void {
        const totalSubObjectives = investigation.subObjectives.length;
        const totalProgress = investigation.subObjectives.reduce(
            (sum, sub) => sum + sub.progress,
            0
        );

        investigation.mainObjective.progress = 
            Math.round((totalProgress / (totalSubObjectives * 100)) * 100);
    }

    public async getActiveLeads(investigationId: string): Promise<Lead[]> {
        const investigation = await InvestigationModel.findOne({ id: investigationId });
        if (!investigation) {
            throw new NotFoundError('Investigation not found');
        }

        return investigation.activeLeads.filter(
            lead => lead.status === 'Active' || lead.status === 'Unexamined'
        );
    }

    public async checkLeadRequirements(
        lead: Lead,
        character: Character
    ): Promise<boolean> {
        if (!lead.requirements) return true;

        return lead.requirements.every(req => {
            switch (req.type) {
                case 'Skill':
                    const skill = character.skills.find(s => s.name === req.value);
                    return skill && skill.level >= req.value;
                case 'Standing':
                    return character.sectStanding >= req.value;
                default:
                    return false;
            }
        });
    }
}
