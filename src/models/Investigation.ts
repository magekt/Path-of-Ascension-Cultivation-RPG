import mongoose, { Schema, Document } from 'mongoose';
import { Investigation } from '../types/investigation';

interface IInvestigationDocument extends Investigation, Document {}

const InvestigationSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['Political', 'Technical', 'Social', 'Resource'],
        required: true 
    },
    mainObjective: {
        description: String,
        progress: { type: Number, default: 0 }
    },
    subObjectives: [{
        id: String,
        name: String,
        description: String,
        progress: { type: Number, default: 0 },
        requiredProgress: Number,
        clues: [{
            id: String,
            description: String,
            discovered: { type: Boolean, default: false },
            leadsTo: [String]
        }]
    }],
    activeLeads: [{
        id: String,
        name: String,
        status: {
            type: String,
            enum: ['Active', 'Unexamined', 'Exhausted', 'Locked']
        },
        requirements: [{
            type: String,
            value: Number
        }]
    }],
    timeRemaining: Number,
    createdAt: { type: String, default: "2025-06-09 17:12:13" },
    lastUpdated: { type: String, default: "2025-06-09 17:12:13" }
});

export const InvestigationModel = mongoose.model<IInvestigationDocument>('Investigation', InvestigationSchema);
