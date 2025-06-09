// Core type definitions for Path of Ascension
export interface Character {
    id: string;
    name: string;
    cultivationStage: CultivationStage;
    qi: {
        current: number;
        max: number;
    };
    sect: string;
    sectStanding: number; // 0-5 stars
    reputation: {
        level: string;
        scope: "Local" | "Regional" | "National";
    };
    skills: Skill[];
    artifacts: Artifact[];
    currentGoal?: string;
    activeEffects: Effect[];
    gameStateId: string;
    createdAt: string;
    lastUpdated: string;
}

export interface CultivationStage {
    name: string;
    level: number;
    progress: number; // 0-100%
    realm: "Qi Condensation" | "Foundation" | "Core Formation" | "Nascent Soul";
    insights: string[];
    breakthroughChance: number;
}

export interface Skill {
    id: string;
    name: string;
    level: number;
    type: "Combat" | "Technical" | "Spiritual" | "Social";
    experience: number;
    proficiency: number; // 0-100%
    masteryLevel: number; // 1-10
    requirements: {
        cultivationLevel: number;
        qiRequirement: number;
        prerequisites: string[]; // Skill IDs
    };
}

export interface Artifact {
    id: string;
    name: string;
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
    effects: Effect[];
    durability: {
        current: number;
        max: number;
    };
    requirements: {
        cultivationLevel: number;
        skills: { name: string; level: number; }[];
    };
    bonuses: {
        type: string;
        value: number;
        condition?: string;
    }[];
}

export interface Effect {
    id: string;
    name: string;
    description: string;
    duration?: number; // in hours
    startTime?: string;
    modifiers: {
        type: "Qi" | "Investigation" | "Social" | "Technical" | "CultivationSpeed";
        value: number;
        target?: string;
    }[];
    conditions?: {
        type: string;
        value: any;
    }[];
    stackable: boolean;
    maxStacks?: number;
    currentStacks?: number;
    source: string; // ID of the source (skill, artifact, etc.)
}
