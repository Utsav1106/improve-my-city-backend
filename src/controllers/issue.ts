import { Request } from "@/types/helpers";
import { createIssue, addComment, getIssues, updateIssueStatus, deleteIssue, getCommentsByIssueId, upvoteIssue } from "@/services/issue";
import { z } from "zod";
import { ValidationError } from "@/utils/errors";

const pincodeToCoordinates = async (_pincode: string): Promise<{ latitude: number; longitude: number } | null> => {
    return {
        latitude: 72.23,
        longitude: 22.8
    }
};

const createIssueSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string().min(1, "Category is required"),
    uploadUrls: z.array(z.string().url()).optional().default([]),
    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        address: z.string().min(1, "Address is required")
    })
});

export const raiseIssue = async (req: Request) => {
    const { userId } = req.user;
    const validatedData = createIssueSchema.parse(req.body);

    const issue = await createIssue({
        ...validatedData,
        userId,
        status: 'open'
    });

    return {
        id: issue._id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        location: issue.location,
        uploadUrls: issue.uploadUrls,
        createdAt: issue.createdAt
    }
};

const addCommentSchema = z.object({
    issueId: z.string().min(1, "Issue ID is required"),
    comment: z.string().min(1, "Comment cannot be empty"),
    uploadUrls: z.array(z.string().url()).optional().default([])
});


export const commentOnIssue = async (req: Request) => {
    const { userId, isAdmin } = req.user;
    const validatedData = addCommentSchema.parse(req.body);

    const comment = await addComment({
        userId,
        issueId: validatedData.issueId,
        comment: validatedData.comment,
        uploadUrls: validatedData.uploadUrls,
        isAdmin
    });

    return {
        id: comment._id,
        issueId: comment.issueId,
        comment: comment.comment,
        uploadUrls: comment.uploadUrls,
        createdAt: comment.createdAt
    }
}


const getIssuesSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
    pincode: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    radiusKm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.enum(['createdAt', 'upvotes']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});

export const fetchAllIssues = async (req: Request) => {
    const validatedQuery = getIssuesSchema.parse(req.query);

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (validatedQuery.pincode) {
        const coords = await pincodeToCoordinates(validatedQuery.pincode);
        if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
        } else {
            throw new ValidationError("Unable to convert pincode to coordinates. Please provide latitude and longitude instead.");
        }
    } else if (validatedQuery.latitude && validatedQuery.longitude) {
        latitude = parseFloat(validatedQuery.latitude);
        longitude = parseFloat(validatedQuery.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new ValidationError("Invalid latitude or longitude");
        }
    }

    const radiusKm = validatedQuery.radiusKm ? parseFloat(validatedQuery.radiusKm) : 100;
    const page = validatedQuery.page ? parseInt(validatedQuery.page) : 1;
    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit) : 20;

    const issues = await getIssues({
        status: validatedQuery.status,
        category: validatedQuery.category,
        userId: validatedQuery.userId,
        latitude,
        longitude,
        radiusKm,
        page,
        limit,
        sortBy: validatedQuery.sortBy,
        sortOrder: validatedQuery.sortOrder
    });

    return {
        count: issues.total,
        page: issues.page,
        totalPages: issues.totalPages,
        issues: issues.data.map(issue => ({
            id: issue._id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            status: issue.status,
            userId: issue.userId,
            reportedByName: issue.reportedByName,
            location: issue.location,
            uploadUrls: issue.uploadUrls,
            upvotes: issue.upvotes || 0,
            upvotedBy: issue.upvotedBy || [],
            distance: issue.distance,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt
        }))
    }
};

export const uploadIssueImages = async (req: Request) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
        throw new ValidationError("No images uploaded");
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 10 * 1024 * 1024;

    if (totalSize > maxSize) {
        throw new ValidationError("Total file size exceeds 10MB limit");
    }

    // Save files to uploads directory
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    try {
        await fs.mkdir(uploadsDir, { recursive: true });
    } catch (err) {
        // Directory already exists or error creating it
    }

    const uploadUrls: string[] = [];
    
    for (const file of files) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const extension = path.extname(file.originalname);
        const filename = `${timestamp}-${randomString}${extension}`;
        const filepath = path.join(uploadsDir, filename);
        
        await fs.writeFile(filepath, file.buffer);
        
        // Return relative URL path
        uploadUrls.push(`/uploads/${filename}`);
    }

    return {
        uploadUrls,
        count: uploadUrls.length
    };
};

const updateStatusSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    resolutionMessage: z.string().optional(),
    resolutionUploadUrls: z.array(z.string().url()).optional()
});

export const updateIssueStatusController = async (req: Request) => {
    const { userId, isAdmin } = req.user;
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const issue = await updateIssueStatus(
        id, 
        validatedData.status, 
        userId, 
        isAdmin,
        validatedData.resolutionMessage,
        validatedData.resolutionUploadUrls
    );

    return {
        id: issue._id,
        title: issue.title,
        status: issue.status,
        updatedAt: issue.updatedAt
    };
};

export const deleteIssueController = async (req: Request) => {
    const { userId, isAdmin } = req.user;
    const { id } = req.params;

    await deleteIssue(id, userId, isAdmin);

    return {
        message: "Issue deleted successfully"
    };
};

export const getIssueComments = async (req: Request) => {
    const { id } = req.params;

    const comments = await getCommentsByIssueId(id);

    return {
        count: comments.length,
        comments: comments.map(comment => ({
            id: comment._id,
            issueId: comment.issueId,
            userId: comment.userId,
            userName: comment.userName,
            comment: comment.comment,
            uploadUrls: comment.uploadUrls,
            isAdmin: comment.isAdmin,
            createdAt: comment.createdAt
        }))
    };
};

export const upvoteIssueController = async (req: Request) => {
    const { userId } = req.user;
    const { id } = req.params;

    const issue = await upvoteIssue(id, userId);

    return {
        id: issue._id,
        upvotes: issue.upvotes,
        upvotedBy: issue.upvotedBy
    };
};

