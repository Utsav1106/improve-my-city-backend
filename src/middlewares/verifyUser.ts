import { JWT_SECRET_KEY } from '@/config/env';
import { Request } from '@/types/helpers';
import { UnauthorizedError } from '@/utils/errors';
import { output } from '@/utils/helpers';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'

export const verifyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError("Unauthorized");

        const token = authHeader.split(' ')[1];
        if (!token) throw new UnauthorizedError("Unauthorized")

        const decoded: any = jwt.verify(token, JWT_SECRET_KEY);

        if (!decoded.userId || !decoded.email) throw new UnauthorizedError("Unauthorized")
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            res.status(401).json(output(false, 'Token expired', { authFailed: true }));
        } else {
            res.status(401).json(output(false, 'Unauthorized', { authFailed: true }));
        }
    }
};

export const verifyUserOptional = async (req: Request, _: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return next()

        const token = authHeader.split(' ')[1];
        if (!token) return next()

        const decoded: any = jwt.verify(token, JWT_SECRET_KEY);
        if (!decoded.userId || !decoded.email) return next()

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            next()
        } else {
            next()
        }
    }
};
