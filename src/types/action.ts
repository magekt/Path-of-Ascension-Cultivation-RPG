// Complete the Action type that was referenced but not fully defined
export interface Action {
    id: string;
    type: 'Technical' | 'Social' | 'Combat' | 'Cultivation';
    description: string;
    requirements: {
        type: 'Qi' | 'Skill' | 'Standing' | 'Resource';
        value: number;
    }[];
    outcomes: {
        success: Effect[];
        failure: Effect[];
    };
    cooldown?: number; // in hours
    lastUsed?: string; // timestamp
}
