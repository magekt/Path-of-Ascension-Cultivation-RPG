import mongoose, { Schema, Document } from 'mongoose';
import { GameState } from '../types/game-state';

interface IGameStateDocument extends GameState, Document {}

const GameStateSchema = new Schema({
    id: { type: String, required: true, unique: true },
    createdAt: { type: String, required: true },
    lastUpdated: { type: String, required: true },
    currentTime: { type: String, required: true },
    characters: { type: Map, of: Schema.Types.Mixed },
    activeInvestigations: { type: Map, of: Schema.Types.Mixed },
    globalEvents: [
        {
            id: String,
            type: String,
            timestamp: String,
            description: String,
            effects: [Schema.Types.Mixed],
            duration: Number
        }
    ],
    timeMultiplier: { type: Number, default: 1 }
});

export const GameStateModel = mongoose.model<IGameStateDocument>('GameState', GameStateSchema);
