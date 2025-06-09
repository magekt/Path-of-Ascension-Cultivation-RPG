import { Request, Response, NextFunction } from 'express';
import { GameError } from '../types/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });

    if (error instanceof GameError) {
        return res.status(error.statusCode).json({
            code: error.code,
            message: error.message,
            details: error.details
        });
    }

    // Default error response
    res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
    });
};
