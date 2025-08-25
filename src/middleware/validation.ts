import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types/errors';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Recursively sanitize all string inputs
        const sanitize = (obj: any): any => {
            if (typeof obj === 'string') {
                return obj.trim().replace(/[<>]/g, '');
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitize);
            }
            if (obj && typeof obj === 'object') {
                const sanitized: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitize(value);
                }
                return sanitized;
            }
            return obj;
        };

        req.body = sanitize(req.body);
        req.query = sanitize(req.query);
        req.params = sanitize(req.params);

        next();
    } catch (error) {
        logger.error('Input sanitization error:', error);
        next(new ValidationError('Invalid input format'));
    }
};

/**
 * Request validation middleware factory
 */
export const validateRequest = (schema: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validate({
                body: req.body,
                query: req.query,
                params: req.params
            }, { abortEarly: false });
            next();
        } catch (error) {
            logger.warn('Request validation failed:', {
                path: req.path,
                method: req.method,
                errors: error.errors
            });
            next(new ValidationError('Request validation failed', error.errors));
        }
    };
};

/**
 * Rate limiting configuration
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
    return rateLimit({
        windowMs,
        max,
        message: message || 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded:', {
                ip: req.ip,
                path: req.path,
                method: req.method
            });
            res.status(429).json({
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later'
            });
        }
    });
};

/**
 * Security middleware setup
 */
export const securityMiddleware = [
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),
    createRateLimit(15 * 60 * 1000, 100), // 100 requests per 15 minutes
    sanitizeInput
];

/**
 * API-specific rate limits
 */
export const apiRateLimit = createRateLimit(60 * 1000, 60); // 60 requests per minute
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes