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
    initialTime: yup.string().matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    timeMultiplier: yup.number().min(0).max(10),
    characters: yup.array().of(characterSchema)
});
