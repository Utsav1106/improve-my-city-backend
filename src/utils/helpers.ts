import { Output, Request, Route } from "@/types/helpers";
import { Response, Router } from "express";
import logger from "./logger";
import { ApiError } from "./errors";
import { ZodError } from "zod";

export const output = <T = any>(success: boolean, message: string = '', data: T = {} as T): Output<T> => {
    return { success, message, data };
};

export const sleep = async (milliseconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const bindRoutes = (router: Router, routes: Route[]) => {
    routes.forEach(({ method, path, outputHandler, middleware = [] }) => {
        const routeHandler = async (req: Request, res: Response): Promise<void> => {
            try {
                const response = await outputHandler(req);
                res.status(200).json(response);
            } catch (e) {
                logger.error(e);

                if (e instanceof ApiError) {
                    res.status(e.statusCode).json(output(false, e.message));
                } else if (e instanceof ZodError) {
                    res.status(400).json(output(false, `${e.name}: ${e.issues.map(x => x.message).join('\n')}`));
                } else {
                    res.status(500).json(output(false, (e as Error).message || 'An unexpected error occurred.'));
                }
            }
        };

        (router as any)[method](path, ...middleware, routeHandler);
    });
};
