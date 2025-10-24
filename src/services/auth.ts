import bcrypt from 'bcrypt';
import userModel from '@/models/user';
import { ValidationError } from '@/utils/errors';

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const createUser = async (email: string, password: string, name: string) => {
    const existingUser = await userModel.findOne({ email }).lean();
    if (existingUser) {
        throw new ValidationError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await userModel.create({
        email,
        createdAt: Date.now(),
        isAdmin: false,
        password: hashedPassword,
        name,
        data: {}
    });

    return user;
}