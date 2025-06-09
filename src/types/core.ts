// Core type definitions for Path of Ascension

export interface Character {
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
}

export interface CultivationStage {
    name: string;
    level: number;
    progress: number; // 0-100%
}

export interface Skill {
    name: string;
    level: number;
    type: "Combat" | "Technical" | "Spiritual" | "Social";
}

export interface Artifact {
    name: string;
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
    effects: Effect[];
}

export interface Effect {
    name: string;
    duration?: number; // in hours
    modifiers: {
        type: "Qi" | "Investigation" | "Social" | "Technical";
        value: number;
    }[];
}
