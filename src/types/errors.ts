export class GameError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'GameError';
    }
}

export class ValidationError extends GameError {
    constructor(message: string, details?: any) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends GameError {
    constructor(message: string) {
        super(message, 'AUTHENTICATION_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends GameError {
    constructor(message: string) {
        super(message, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
