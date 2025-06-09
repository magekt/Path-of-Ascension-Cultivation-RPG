import mongoose, { Schema, Document } from 'mongoose';
import { Character } from '../types/core';

interface ICharacterDocument extends Character, Document {}

const CharacterSchema = new Schema({
    name: { type: String, required: true },
    cultivationStage: {
        name: String,
        level: Number,
        progress: Number
    },
    qi: {
        current: Number,
        max: Number
    },
    sect: String,
    sectStanding: Number,
    reputation: {
        level: String,
        scope: String
    },
    skills: [{
        name: String,
        level: Number,
        type: String
    }],
    artifacts: [{
        name: String,
        rarity: String,
        effects: [Schema.Types.Mixed]
    }],
    currentGoal: String,
    activeEffects: [Schema.Types.Mixed]
});

export const CharacterModel = mongoose.model<ICharacterDocument>('Character', CharacterSchema);
