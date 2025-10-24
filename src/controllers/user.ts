import { getUser } from "@/services/user";
import { Output, Request } from "@/types/helpers";
import { output } from "@/utils/helpers";

export const getMyUser = async (req: Request): Promise<Output> => {
    const { userId } = req.user;
    const user = await getUser(userId);
    return output(true, '', {
        id: user._id,
        email: user.email,
        name: user.name
    })
}