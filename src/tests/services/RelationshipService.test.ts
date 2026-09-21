import { RelationshipService } from '../../services/RelationshipService';
import { WebSocketService } from '../../services/WebSocketService';

jest.mock('../../services/WebSocketService');

describe('RelationshipService', () => {
    let relationshipService: RelationshipService;
    let mockWebSocketService: jest.Mocked<WebSocketService>;

    beforeEach(() => {
        mockWebSocketService = new WebSocketService({} as any) as jest.Mocked<WebSocketService>;
        mockWebSocketService.broadcastEvent = jest.fn();
        relationshipService = new RelationshipService(mockWebSocketService);
    });

    describe('registerNPC & updateNPCAttitude', () => {
        it('should register an NPC and clamp attitude within 0-100', () => {
            const npc = relationshipService.registerNPC({
                name: 'Elder Liu',
                position: 'Outer Sect Elder',
                attitude: 45
            });

            expect(npc).toBeDefined();
            expect(npc.name).toEqual('Elder Liu');
            expect(npc.attitude).toEqual(45);
        });

        it('should update NPC attitude and unlock milestones when required threshold is met', () => {
            const npc = relationshipService.registerNPC({
                name: 'Senior Ming',
                attitude: 40,
                milestones: [
                    {
                        id: 'm1',
                        name: 'High Trust',
                        requiredAttitude: 50,
                        unlocked: false,
                        rewardDescription: 'Access to Sect Library Secret Chamber'
                    }
                ]
            });

            const result = relationshipService.updateNPCAttitude(npc.id, 15, 'game-123', 'Reported Spring Crisis');
            expect(result.npc.attitude).toEqual(55);
            expect(result.newlyUnlockedMilestones.length).toEqual(1);
            expect(result.newlyUnlockedMilestones[0].id).toEqual('m1');
            expect(mockWebSocketService.broadcastEvent).toHaveBeenCalled();
        });
    });

    describe('registerFaction & updateFactionStanding', () => {
        it('should register a faction standing and update title based on level', () => {
            const faction = relationshipService.registerFaction('azure-cloud', 'Azure Cloud Sect', 3);
            expect(faction.standingLevel).toEqual(3);
            expect(faction.title).toEqual('Neutral');

            const updated = relationshipService.updateFactionStanding('azure-cloud', 2, 'game-123');
            expect(updated.standingLevel).toEqual(5);
            expect(updated.title).toEqual('Respected / Revered');
        });
    });
});
