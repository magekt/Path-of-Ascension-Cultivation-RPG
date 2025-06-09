export interface GameState {
    id: string;
    createdBy: string; // User ID who created the game
    createdAt: string; // UTC timestamp
    lastUpdated: string; // UTC timestamp
    currentTime: string; // In-game time (UTC)
    characters: Map<string, Character>;
    activeInvestigations: Map<string, Investigation>;
    globalEvents: Event[];
    timeMultiplier: number; // For time progression control
    settings: GameSettings;
    status: GameStatus;
}

export interface GameSettings {
    initialTime: string;
    timeMultiplier: number;
    difficultyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    permadeath: boolean;
    maxCharacters: number;
    startingResources: ResourcePool;
    eventFrequency: number; // 0-100%
    breakthroughDifficulty: number; // 0-100%
}

export interface GameStatus {
    active: boolean;
    paused: boolean;
    lastCheckpoint: string;
    saveVersion: string;
    uptime: number; // in hours
    metrics: {
        totalBreakthroughs: number;
        completedInvestigations: number;
        discoveredArtifacts: number;
        globalEventCount: number;
    };
}

export interface Event {
    id: string;
    type: "Investigation" | "Cultivation" | "Social" | "System" | "Global";
    name: string;
    description: string;
    timestamp: string;
    duration?: number; // in hours
    priority: number; // 1-10
    effects: Effect[];
    requirements?: {
        type: string;
        value: any;
    }[];
    progress?: number; // 0-100%
    status: "Pending" | "Active" | "Completed" | "Failed";
    rewards?: {
        type: string;
        value: any;
    }[];
    participants?: string[]; // Character IDs
}

export interface ResourcePool {
    spiritStones: number;
    meritPoints: number;
    reputation: number;
    tools: Map<string, number>; // tool ID -> quantity
    materials: Map<string, number>; // material ID -> quantity
    emergency: EmergencyResource[];
}

export interface EmergencyResource {
    id: string;
    name: string;
    quantity: number;
    type: "Healing" | "Protection" | "Escape" | "Power";
    requirements: {
        type: "Standing" | "Cultivation" | "Merit";
        value: number;
    }[];
    cooldown: number; // in hours
    lastUsed?: string;
}

export interface GameStateOptions {
    initialTime?: string;
    timeMultiplier?: number;
    characters?: Character[];
    settings?: Partial<GameSettings>;
    createdBy?: string;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
    initialTime: "2025-06-09 17:21:49",
    timeMultiplier: 1,
    difficultyLevel: "Intermediate",
    permadeath: false,
    maxCharacters: 3,
    startingResources: {
        spiritStones: 100,
        meritPoints: 0,
        reputation: 0,
        tools: new Map(),
        materials: new Map(),
        emergency: []
    },
    eventFrequency: 50,
    breakthroughDifficulty: 50
};

export const createDefaultGameState = (options: GameStateOptions): Partial<GameState> => {
    const timestamp = "2025-06-09 17:21:49";
    return {
        createdAt: timestamp,
        lastUpdated: timestamp,
        currentTime: options.initialTime || timestamp,
        characters: new Map(),
        activeInvestigations: new Map(),
        globalEvents: [],
        timeMultiplier: options.timeMultiplier || 1,
        settings: {
            ...DEFAULT_GAME_SETTINGS,
            ...options.settings
        },
        status: {
            active: true,
            paused: false,
            lastCheckpoint: timestamp,
            saveVersion: "1.0.0",
            uptime: 0,
            metrics: {
                totalBreakthroughs: 0,
                completedInvestigations: 0,
                discoveredArtifacts: 0,
                globalEventCount: 0
            }
        }
    };
};
