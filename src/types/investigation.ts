export interface Investigation {
    id: string;
    name: string;
    type: 'Political' | 'Technical' | 'Social' | 'Resource';
    difficulty: number; // 1-10
    mainObjective: {
        description: string;
        progress: number; // 0-100%
        requirements: Requirement[];
    };
    subObjectives: SubObjective[];
    activeLeads: Lead[];
    timeRemaining: number; // hours
    gameStateId: string;
    assignedCharacters: string[]; // Character IDs
    rewards: Reward[];
    createdAt: string;
    lastUpdated: string;
    status: 'Active' | 'Complete' | 'Failed';
}

export interface SubObjective {
    id: string;
    name: string;
    description: string;
    progress: number; // 0-100%
    requiredProgress: number;
    clues: Clue[];
    dependencies?: string[]; // Other SubObjective IDs
    requirements: Requirement[];
}

export interface Clue {
    id: string;
    description: string;
    discovered: boolean;
    leadsTo: string[]; // Lead IDs
    requirements: Requirement[];
    discoveredAt?: string;
    discoveredBy?: string; // Character ID
}

export interface Lead {
    id: string;
    name: string;
    description: string;
    status: 'Active' | 'Unexamined' | 'Exhausted' | 'Locked';
    requirements: Requirement[];
    clueChance: number; // 0-100%
    timeToInvestigate: number; // hours
    relatedClues: string[]; // Clue IDs
    rewards?: Reward[];
}

export interface Requirement {
    type: 'Skill' | 'Standing' | 'Cultivation' | 'Resource' | 'Time';
    value: number;
    condition?: string;
}

export interface Reward {
    type: 'Qi' | 'Standing' | 'Resource' | 'Skill' | 'Knowledge';
    value: number;
    probability?: number; // 0-100%
    conditions?: {
        type: string;
        value: any;
    }[];
}

export const createInvestigation = (
    data: Partial<Investigation>,
    characterId: string
): Investigation => {
    const timestamp = "2025-06-09 17:24:18";
    
    return {
        id: crypto.randomUUID(),
        name: data.name || 'Unnamed Investigation',
        type: data.type || 'Technical',
        difficulty: data.difficulty || 1,
        mainObjective: {
            description: data.mainObjective?.description || '',
            progress: 0,
            requirements: data.mainObjective?.requirements || []
        },
        subObjectives: data.subObjectives || [],
        activeLeads: data.activeLeads || [],
        timeRemaining: data.timeRemaining || 168, // Default 1 week
        gameStateId: data.gameStateId || '',
        assignedCharacters: [characterId],
        rewards: data.rewards || [],
        createdAt: timestamp,
        lastUpdated: timestamp,
        status: 'Active',
        ...data
    };
};

export interface InvestigationProgress {
    investigationId: string;
    characterId: string;
    timestamp: string;
    progressMade: number;
    newCluesDiscovered: string[]; // Clue IDs
    leadsExhausted: string[]; // Lead IDs
    skillsUsed: {
        skillId: string;
        successRate: number;
    }[];
}

export const createInvestigationProgress = (
    investigationId: string,
    characterId: string,
    data: Partial<InvestigationProgress>
): InvestigationProgress => {
    return {
        investigationId,
        characterId,
        timestamp: "2025-06-09 17:24:18",
        progressMade: data.progressMade || 0,
        newCluesDiscovered: data.newCluesDiscovered || [],
        leadsExhausted: data.leadsExhausted || [],
        skillsUsed: data.skillsUsed || []
    };
};
