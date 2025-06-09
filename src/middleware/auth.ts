import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('Authentication token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded as { id: string; username: string };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};
