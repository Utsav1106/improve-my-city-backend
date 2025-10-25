import { sendChatMessage } from "@/controllers/chatbot";
import { verifyUser } from "@/middlewares/verifyUser";
import { Route } from "@/types/helpers";
import { bindRoutes } from "@/utils/helpers";
import { Router } from "express";

const routes: Route[] = [
    {
        method: 'post',
        path: '/message',
        middleware: [verifyUser],
        outputHandler: sendChatMessage
    }
];

const chatbotRoutes = Router();

bindRoutes(chatbotRoutes, routes);

export default chatbotRoutes;
