// Game state management types
export interface GameState {
    id: string;
    createdAt: string; // UTC timestamp
    lastUpdated: string; // UTC timestamp
    currentTime: string; // In-game time (UTC)
    characters: Map<string, Character>;
    activeInvestigations: Map<string, Investigation>;
    globalEvents: Event[];
    timeMultiplier: number; // For time progression control
}

export interface Event {
    id: string;
    type: "Investigation" | "Cultivation" | "Social" | "System";
    timestamp: string;
    description: string;
    effects: Effect[];
    duration?: number; // in hours
}

export interface GameStateOptions {
    initialTime?: string;
    timeMultiplier?: number;
    characters?: Character[];
}
