// Investigation system types

export interface Investigation {
    id: string;
    name: string;
    type: "Political" | "Technical" | "Social" | "Resource";
    mainObjective: {
        description: string;
        progress: number; // 0-100%
    };
    subObjectives: SubObjective[];
    activeLeads: Lead[];
    npcs: NPCRelation[];
    resources: ResourcePool;
    timeRemaining: number; // in hours
}

export interface SubObjective {
    id: string;
    name: string;
    description: string;
    progress: number; // 0-100%
    clues: Clue[];
    requiredProgress: number;
    unlocks?: string[]; // IDs of things this unlocks
}

export interface Lead {
    id: string;
    name: string;
    status: "Active" | "Unexamined" | "Exhausted" | "Locked";
    requirements?: {
        type: "Skill" | "Standing" | "Resource";
        value: number;
    }[];
}

export interface Clue {
    id: string;
    description: string;
    discovered: boolean;
    leadsTo?: string[]; // IDs of leads this connects to
}

export interface NPCRelation {
    id: string;
    name: string;
    position: string;
    attitude: number; // 0-8
    trust: number; // 0-8
    recentInteractions: Interaction[];
    availableActions: Action[];
}

export interface Interaction {
    date: Date;
    description: string;
    impact: number; // positive or negative
}

export interface Action {
    id: string;
    description: string;
    requirements: {
        type: string;
        value: number;
    }[];
    outcomes: {
        success: Effect[];
        failure: Effect[];
    };
}

export interface ResourcePool {
    spiritStones: number;
    meritPoints: number;
    tools: Tool[];
    emergency: EmergencyResource[];
}

export interface Tool {
    name: string;
    uses: number;
    effects: Effect[];
}

export interface EmergencyResource {
    name: string;
    quantity: number;
    requirements: {
        type: string;
        value: number;
    }[];
}
