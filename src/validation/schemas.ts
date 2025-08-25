import * as yup from 'yup';

export const characterSchema = yup.object({
    name: yup.string().required(),
    cultivationStage: yup.object({
        name: yup.string().required(),
        level: yup.number().min(0).required(),
        progress: yup.number().min(0).max(100).required()
    }).required(),
    qi: yup.object({
        current: yup.number().min(0).required(),
        max: yup.number().min(0).required()
    }).required(),
    sect: yup.string().required(),
    sectStanding: yup.number().min(0).max(5).required()
});

export const gameStateSchema = yup.object({
    body: yup.object({
        initialTime: yup.string().matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/).optional(),
        timeMultiplier: yup.number().min(0.1).max(10).optional(),
        characters: yup.array().of(characterSchema).max(3).optional(),
        settings: yup.object({
            difficultyLevel: yup.string().oneOf(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
            permadeath: yup.boolean().optional(),
            maxCharacters: yup.number().min(1).max(5).optional()
        }).optional()
    }).required()
});

export const advanceTimeSchema = yup.object({
    params: yup.object({
        id: yup.string().uuid().required()
    }).required(),
    body: yup.object({
        hours: yup.number().integer().min(1).max(24).required()
    }).required()
});

export const investigationSchema = yup.object({
    body: yup.object({
        name: yup.string().min(3).max(100).required(),
        type: yup.string().oneOf(['Political', 'Technical', 'Social', 'Resource']).required(),
        difficulty: yup.number().min(1).max(10).required(),
        timeRemaining: yup.number().min(1).max(168).optional(), // Max 1 week
        gameStateId: yup.string().uuid().required()
    }).required()
});

export const updateProgressSchema = yup.object({
    params: yup.object({
        id: yup.string().uuid().required()
    }).required(),
    body: yup.object({
        subObjectiveId: yup.string().uuid().required(),
        progress: yup.number().min(0).max(100).required(),
        character: yup.object({
            id: yup.string().uuid().required(),
            skills: yup.array().of(yup.object({
                name: yup.string().required(),
                level: yup.number().min(1).required(),
                type: yup.string().oneOf(['Combat', 'Technical', 'Spiritual', 'Social']).required()
            })).required()
        }).required()
    }).required()
});

export const authSchema = yup.object({
    body: yup.object({
        username: yup.string().min(3).max(30).required(),
        password: yup.string().min(8).max(128).required()
    }).required()
});

// Common parameter schemas
export const uuidParamSchema = yup.object({
    params: yup.object({
        id: yup.string().uuid().required()
    }).required()
});

// Query parameter schemas
export const paginationSchema = yup.object({
    query: yup.object({
        page: yup.number().integer().min(1).optional(),
        limit: yup.number().integer().min(1).max(100).optional(),
        sortBy: yup.string().optional(),
        sortOrder: yup.string().oneOf(['asc', 'desc']).optional()
    }).optional()
});

// WebSocket message schemas
export const wsMessageSchema = yup.object({
    type: yup.string().oneOf(['command', 'ping', 'subscribe', 'unsubscribe']).required(),
    payload: yup.mixed().required()
});

export const wsCommandSchema = yup.object({
    command: yup.string().required(),
    gameStateId: yup.string().uuid().optional(),
    data: yup.mixed().optional()
});

// Validation helper functions
export const validateUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
};

export const validateTimestamp = (value: string): boolean => {
    const timestamp = new Date(value);
    return !isNaN(timestamp.getTime());
};

export const sanitizeString = (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
};

// Custom validation messages
yup.setLocale({
    mixed: {
        required: 'This field is required',
        notType: 'Invalid type provided'
    },
    string: {
        min: 'Must be at least ${min} characters',
        max: 'Must be at most ${max} characters',
        matches: 'Invalid format'
    },
    number: {
        min: 'Must be at least ${min}',
        max: 'Must be at most ${max}',
        integer: 'Must be an integer'
    }
});
    timeMultiplier: yup.number().min(0).max(10),
    characters: yup.array().of(characterSchema)
});
