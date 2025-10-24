import { Request as ExpressRequest, NextFunction, Response } from 'express'

export interface Output<T = any> {
    success: boolean;
    message: string;
    data: T;
}

export interface Request extends ExpressRequest {
    user: {
        userId: string;
        email: string;
    }
}

export interface Route {
    method: 'get' | 'post' | 'patch' | 'delete' | 'put';
    path: string,
    outputHandler: (req: Request) => Promise<Output> | Output
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>
}