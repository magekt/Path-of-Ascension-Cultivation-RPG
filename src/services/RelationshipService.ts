import { WebSocketService } from './WebSocketService';
import { logger } from '../utils/logger';

export interface NPCMilestone {
    id: string;
    name: string;
    requiredAttitude: number; // 0-100
    unlocked: boolean;
    rewardDescription: string;
}

export interface NPCInteractionOption {
    id: string;
    description: string;
    attitudeImpact: number;
    hoursRequired: number;
    resourceCost?: {
        type: 'Qi' | 'MeritPoints' | 'SpiritStones';
        amount: number;
    };
}

export interface NPC {
    id: string;
    name: string;
    position: string;
    faction: string;
    attitude: number; // 0-100
    keyTraits: string[];
    milestones: NPCMilestone[];
    lastInteractionTime?: string;
}

export interface FactionStanding {
    factionId: string;
    factionName: string;
    standingLevel: number; // 1-5
    title: string;
}

export class RelationshipService {
    private webSocketService: WebSocketService;
    private npcs: Map<string, NPC> = new Map();
    private factions: Map<string, FactionStanding> = new Map();

    constructor(webSocketService: WebSocketService) {
        this.webSocketService = webSocketService;
    }

    public registerNPC(npcData: Partial<NPC>): NPC {
        const id = npcData.id || crypto.randomUUID();
        const npc: NPC = {
            id,
            name: npcData.name || 'Unknown Elder',
            position: npcData.position || 'Disciple',
            faction: npcData.faction || 'Azure Cloud Sect',
            attitude: Math.max(0, Math.min(100, npcData.attitude ?? 50)),
            keyTraits: npcData.keyTraits || [],
            milestones: npcData.milestones || [],
            lastInteractionTime: npcData.lastInteractionTime || new Date().toISOString()
        };

        this.npcs.set(id, npc);
        logger.info('Registered NPC', { npcId: id, name: npc.name });
        return npc;
    }

    public updateNPCAttitude(
        npcId: string,
        delta: number,
        gameStateId: string,
        reason: string
    ): { npc: NPC; newlyUnlockedMilestones: NPCMilestone[] } {
        const npc = this.npcs.get(npcId);
        if (!npc) {
            throw new Error(`NPC not found: ${npcId}`);
        }

        const oldAttitude = npc.attitude;
        npc.attitude = Math.max(0, Math.min(100, npc.attitude + delta));
        npc.lastInteractionTime = new Date().toISOString();

        const newlyUnlockedMilestones: NPCMilestone[] = [];
        npc.milestones.forEach(m => {
            if (!m.unlocked && npc.attitude >= m.requiredAttitude) {
                m.unlocked = true;
                newlyUnlockedMilestones.push(m);
            }
        });

        this.webSocketService.broadcastEvent({
            type: 'NPC_RELATIONSHIP_UPDATED' as any,
            gameStateId,
            timestamp: npc.lastInteractionTime,
            data: {
                npcId: npc.id,
                oldAttitude,
                newAttitude: npc.attitude,
                delta,
                reason,
                unlockedMilestones: newlyUnlockedMilestones
            }
        });

        return { npc, newlyUnlockedMilestones };
    }

    public registerFaction(factionId: string, factionName: string, initialLevel: number = 3): FactionStanding {
        const title = this.getFactionTitle(initialLevel);
        const faction: FactionStanding = {
            factionId,
            factionName,
            standingLevel: Math.max(1, Math.min(5, initialLevel)),
            title
        };

        this.factions.set(factionId, faction);
        return faction;
    }

    public updateFactionStanding(
        factionId: string,
        delta: number,
        gameStateId: string
    ): FactionStanding {
        let faction = this.factions.get(factionId);
        if (!faction) {
            faction = this.registerFaction(factionId, factionId, 3);
        }

        faction.standingLevel = Math.max(1, Math.min(5, faction.standingLevel + delta));
        faction.title = this.getFactionTitle(faction.standingLevel);

        this.webSocketService.broadcastEvent({
            type: 'FACTION_STANDING_UPDATED' as any,
            gameStateId,
            timestamp: new Date().toISOString(),
            data: {
                factionId: faction.factionId,
                standingLevel: faction.standingLevel,
                title: faction.title
            }
        });

        return faction;
    }

    public getNPC(npcId: string): NPC | undefined {
        return this.npcs.get(npcId);
    }

    public getAllNPCs(): NPC[] {
        return Array.from(this.npcs.values());
    }

    public getFactionStanding(factionId: string): FactionStanding | undefined {
        return this.factions.get(factionId);
    }

    private getFactionTitle(level: number): string {
        switch (level) {
            case 1: return 'Hostile';
            case 2: return 'Cautious';
            case 3: return 'Neutral';
            case 4: return 'Friendly';
            case 5: return 'Respected / Revered';
            default: return 'Neutral';
        }
    }
}
