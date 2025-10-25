import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    }
});

// Middleware to handle upload errors
export const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ 
                success: false, 
                message: 'File size exceeds 10MB limit' 
            });
            return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json({ 
                success: false, 
                message: 'Maximum 10 files allowed' 
            });
            return;
        }
        res.status(400).json({ 
            success: false, 
            message: err.message 
        });
        return;
    }
    if (err) {
        res.status(400).json({ 
            success: false, 
            message: err.message 
        });
        return;
    }
    next();
};

export const uploadImages = upload.array('images', 10);
