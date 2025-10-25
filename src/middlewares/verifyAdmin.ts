import { Request } from "@/types/helpers";
import { Response, NextFunction } from "express";

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required.",
            authFailed: false
        });
        return;
    }
    next();
};
