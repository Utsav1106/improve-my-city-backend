import { signIn, signUp } from "@/controllers/auth";
import { Route } from "@/types/helpers";
import { bindRoutes } from "@/utils/helpers";
import { Router } from "express";

const routes: Route[] = [
    {
        method: 'post',
        path: '/sign-up',
        outputHandler: signUp
    },
    {
        method: 'post',
        path: '/sign-in',
        outputHandler: signIn
    }
]

const authRoutes = Router()
bindRoutes(authRoutes, routes)

export default authRoutes