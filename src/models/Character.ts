import mongoose, { Schema, Document } from 'mongoose';
import { Character, Skill, Artifact, Effect } from '../types/core';

interface ICharacterDocument extends Character, Document {}

const EffectSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    duration: Number,
    startTime: { type: String, default: "2025-06-09 17:26:10" },
    modifiers: [{
        type: { 
            type: String, 
            enum: ['Qi', 'Investigation', 'Social', 'Technical', 'CultivationSpeed'],
            required: true 
        },
        value: { type: Number, required: true },
        target: String
    }],
    conditions: [{
        type: String,
        value: Schema.Types.Mixed
    }],
    stackable: { type: Boolean, default: false },
    maxStacks: Number,
    currentStacks: { type: Number, default: 1 },
    source: { type: String, required: true }
});

const SkillSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: Number, required: true, min: 1 },
    type: { 
        type: String, 
        enum: ['Combat', 'Technical', 'Spiritual', 'Social'],
        required: true 
    },
    experience: { type: Number, default: 0 },
    proficiency: { type: Number, min: 0, max: 100, default: 0 },
    masteryLevel: { type: Number, min: 1, max: 10, default: 1 },
    requirements: {
        cultivationLevel: { type: Number, required: true },
        qiRequirement: { type: Number, required: true },
        prerequisites: [String]
    }
});

const ArtifactSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    rarity: { 
        type: String, 
        enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
        required: true 
    },
    effects: [EffectSchema],
    durability: {
        current: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    requirements: {
        cultivationLevel: { type: Number, required: true },
        skills: [{
            name: String,
            level: Number
        }]
    },
    bonuses: [{
        type: String,
        value: Number,
        condition: String
    }]
});

const CharacterSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    cultivationStage: {
        name: { type: String, required: true },
        level: { type: Number, required: true },
        progress: { type: Number, required: true, min: 0, max: 100 },
        realm: { 
            type: String, 
            enum: ['Qi Condensation', 'Foundation', 'Core Formation', 'Nascent Soul'],
            required: true 
        },
        insights: [String],
        breakthroughChance: { type: Number, min: 0, max: 100 }
    },
    qi: {
        current: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    sect: { type: String, required: true },
    sectStanding: { type: Number, required: true, min: 0, max: 5 },
    reputation: {
        level: String,
        scope: { 
            type: String, 
            enum: ['Local', 'Regional', 'National'],
            required: true 
        }
    },
    skills: [SkillSchema],
    artifacts: [ArtifactSchema],
    currentGoal: String,
    activeEffects: [EffectSchema],
    gameStateId: { type: String, required: true },
    createdAt: { type: String, default: "2025-06-09 17:26:10" },
    lastUpdated: { type: String, default: "2025-06-09 17:26:10" }
}, {
    timestamps: { currentTime: () => "2025-06-09 17:26:10" }
});

// Middleware to update lastUpdated
CharacterSchema.pre('save', function(next) {
    this.lastUpdated = "2025-06-09 17:26:10";
    next();
});

// Methods
CharacterSchema.methods.addEffect = function(effect: Effect) {
    if (!effect.stackable) {
        // Remove existing effect of same type
        this.activeEffects = this.activeEffects.filter(e => e.id !== effect.id);
    } else if (effect.maxStacks) {
        // Handle stacking
        const existing = this.activeEffects.find(e => e.id === effect.id);
        if (existing && existing.currentStacks) {
            existing.currentStacks = Math.min(
                (existing.currentStacks + 1),
                effect.maxStacks
            );
            return;
        }
    }
    this.activeEffects.push(effect);
};

CharacterSchema.methods.removeEffect = function(effectId: string) {
    this.activeEffects = this.activeEffects.filter(e => e.id !== effectId);
};

CharacterSchema.methods.updateQi = function(amount: number) {
    this.qi.current = Math.max(0, Math.min(this.qi.current + amount, this.qi.max));
};

export const CharacterModel = mongoose.model<ICharacterDocument>('Character', CharacterSchema);
