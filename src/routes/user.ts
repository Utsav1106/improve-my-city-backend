import { getMyUser } from "@/controllers/user";
import { verifyUser } from "@/middlewares/verifyUser";
import { Route } from "@/types/helpers";
import { bindRoutes } from "@/utils/helpers";
import { Router } from "express";

const routes: Route[] = [
    {
        method: 'get',
        path: '/me',
        middleware: [verifyUser],
        outputHandler: getMyUser
    }
]

const userRoutes = Router()
bindRoutes(userRoutes, routes)

export default userRoutes