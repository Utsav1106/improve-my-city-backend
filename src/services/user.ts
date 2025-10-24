import userModel from "@/models/user";
import { User } from "@/types/user";
import { NotFoundError } from "@/utils/errors";

export const getUser = async (userId: string): Promise<User> => {
    const user = await userModel.findById(userId).lean();

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    return await userModel.findOne({ email }).lean();
};
