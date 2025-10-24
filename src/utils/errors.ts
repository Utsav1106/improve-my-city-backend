export class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

export class ValidationError extends ApiError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class ServerError extends ApiError {
    constructor(message: string) {
        super(message, 500);
    }
}
