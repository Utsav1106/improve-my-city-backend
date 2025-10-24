import { getUser } from "@/services/user";
import { Request } from "@/types/helpers";

export const getMyUser = async (req: Request) => {
    const { userId } = req.user;
    const user = await getUser(userId);

    return {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
    }
}