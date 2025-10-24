import { Request } from 'express';
import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from '@/config/env';
import { Output } from '@/types/helpers';
import { createUser, verifyPassword } from '@/services/auth';
import { output } from '@/utils/helpers';
import { UnauthorizedError, ValidationError } from '@/utils/errors';
import userModel from '@/models/user';

export const signUp = async (req: Request): Promise<Output> => {
    const { email, password, name } = req.body;
    
    if (!email) throw new ValidationError("Email is not provided");
    if (!password) throw new ValidationError("Password is not provided");
    if (!name) throw new ValidationError("Name is not provided");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new ValidationError("Invalid email format");

    if (password.length < 8) throw new ValidationError("Password must be at least 8 characters long");

    const user = await createUser(email, password, name);

    const jwtPayload = {
        userId: user._id!.toString(),
        email: user.email
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET_KEY, { expiresIn: '7d' });

    return output(true, 'User created successfully', { 
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name
        }
    });
}

export const signIn = async (req: Request): Promise<Output> => {
    const { email, password } = req.body;
    
    if (!email) throw new ValidationError("Email is not provided");
    if (!password) throw new ValidationError("Password is not provided");

    const user = await userModel.findOne({ email }).lean();
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const isVerified = await verifyPassword(password, user.password);
    if (!isVerified) throw new UnauthorizedError('Invalid email or password');

    const jwtPayload = {
        userId: user._id!.toString(),
        email: user.email
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET_KEY, { expiresIn: '7d' });

    return output(true, 'Signed in successfully', { 
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name
        }
    });
}