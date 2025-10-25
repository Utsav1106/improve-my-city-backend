import { raiseIssue, commentOnIssue, fetchAllIssues, uploadIssueImages, updateIssueStatusController, deleteIssueController, getIssueComments, upvoteIssueController } from "@/controllers/issue";
import { verifyUser } from "@/middlewares/verifyUser";
import { verifyAdmin } from "@/middlewares/verifyAdmin";
import { uploadImages, handleUploadError } from "@/middlewares/upload";
import { Request, Route } from "@/types/helpers";
import { bindRoutes } from "@/utils/helpers";
import { Router, Response } from "express";
import { ApiError } from "@/utils/errors";

const routes: Route[] = [
    {
        method: 'post',
        path: '/',
        middleware: [verifyUser],
        outputHandler: raiseIssue
    },
    {
        method: 'post',
        path: '/comment',
        middleware: [verifyUser],
        outputHandler: commentOnIssue
    },
    {
        method: 'get',
        path: '/',
        middleware: [verifyUser],
        outputHandler: fetchAllIssues
    },
    {
        method: 'put',
        path: '/:id/status',
        middleware: [verifyUser, verifyAdmin],
        outputHandler: updateIssueStatusController
    },
    {
        method: 'delete',
        path: '/:id',
        middleware: [verifyUser, verifyAdmin],
        outputHandler: deleteIssueController
    },
    {
        method: 'get',
        path: '/:id/comments',
        middleware: [verifyUser],
        outputHandler: getIssueComments
    },
    {
        method: 'post',
        path: '/:id/upvote',
        middleware: [verifyUser],
        outputHandler: upvoteIssueController
    }
]

const issueRoutes = Router()

issueRoutes.post('/upload', verifyUser as any, uploadImages, handleUploadError, (async (req: Request, res: Response) => {
    try {
        const result = await uploadIssueImages(req);
        res.status(200).json(result);
    } catch (error: any) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
}) as any);

bindRoutes(issueRoutes, routes)

export default issueRoutes
