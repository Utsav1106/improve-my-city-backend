import issueModel from "@/models/issue";
import commentModel from "@/models/comment";
import userModel from "@/models/user";
import { Issue } from "@/types/issue";
import { Comment } from "@/types/comment";
import { NotFoundError, UnauthorizedError } from "@/utils/errors";

export const createIssue = async (issueData: Omit<Issue, '_id' | 'createdAt' | 'updatedAt'>): Promise<Issue> => {
    const now = Date.now();
    const issue = await issueModel.create({
        ...issueData,
        createdAt: now,
        updatedAt: now
    });

    return issue.toObject();
};

export const getIssue = async (issueId: string): Promise<Issue> => {
    const issue = await issueModel.findById(issueId).lean();

    if (!issue) {
        throw new NotFoundError("Issue not found");
    }

    return issue;
};

export const addComment = async (commentData: Omit<Comment, '_id' | 'createdAt'>): Promise<Comment> => {
    await getIssue(commentData.issueId);

    const comment = await commentModel.create({
        ...commentData,
        createdAt: Date.now()
    });

    return comment.toObject();
};

export const getCommentsByIssueId = async (issueId: string): Promise<(Comment & { userName?: string })[]> => {
    const comments = await commentModel.find({ issueId }).sort({ createdAt: -1 }).lean();
    
    // Get user information for each comment
    const commentsWithUserNames = await Promise.all(
        comments.map(async (comment) => {
            const user = await userModel.findById(comment.userId).lean();
            return {
                ...comment,
                userName: user?.name || 'User'
            };
        })
    );
    
    return commentsWithUserNames;
};

interface GetIssuesFilters {
    status?: string;
    category?: string;
    userId?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'upvotes';
    sortOrder?: 'asc' | 'desc';
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getIssues = async (filters: GetIssuesFilters): Promise<{
    data: (Issue & { distance?: number; reportedByName?: string })[];
    total: number;
    page: number;
    totalPages: number;
}> => {
    const query: any = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.userId) {
        query.userId = filters.userId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const total = await issueModel.countDocuments(query);
    
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    let issues = await issueModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();

    // Get user names for all issues
    const issuesWithUserNames = await Promise.all(
        issues.map(async (issue) => {
            const user = await userModel.findById(issue.userId).lean();
            return {
                ...issue,
                reportedByName: user?.name || 'User'
            };
        })
    );

    if (filters.latitude !== undefined && filters.longitude !== undefined) {
        const radiusKm = filters.radiusKm || 100;

        const issuesWithDistance = issuesWithUserNames
            .map(issue => {
                const distance = calculateDistance(
                    filters.latitude!,
                    filters.longitude!,
                    issue.location.latitude,
                    issue.location.longitude
                );
                return { ...issue, distance };
            })
            .filter(issue => issue.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);
        
        return {
            data: issuesWithDistance,
            total: issuesWithDistance.length,
            page,
            totalPages: Math.ceil(issuesWithDistance.length / limit)
        };
    }

    return {
        data: issuesWithUserNames,
        total,
        page,
        totalPages
    };
};

export const updateIssueStatus = async (
    issueId: string, 
    status: Issue['status'], 
    userId: string, 
    isAdmin: boolean,
    resolutionMessage?: string,
    resolutionUploadUrls?: string[]
): Promise<Issue> => {
    const issue = await issueModel.findById(issueId);

    if (!issue) {
        throw new NotFoundError("Issue not found");
    }

    if (!isAdmin && issue.userId !== userId) {
        throw new UnauthorizedError("You don't have permission to update this issue");
    }

    issue.status = status;
    issue.updatedAt = Date.now();
    
    if (status === 'resolved') {
        issue.resolvedAt = Date.now();
        if (resolutionMessage) {
            issue.resolutionMessage = resolutionMessage;
        }
        if (resolutionUploadUrls) {
            issue.resolutionUploadUrls = resolutionUploadUrls;
        }
        
        if (resolutionMessage) {
            await commentModel.create({
                issueId,
                userId,
                comment: resolutionMessage,
                uploadUrls: resolutionUploadUrls || [],
                isAdmin: isAdmin,
                createdAt: Date.now()
            });
        }
    }
    
    await issue.save();

    return issue.toObject();
};

export const deleteIssue = async (issueId: string, userId: string, isAdmin: boolean): Promise<void> => {
    const issue = await issueModel.findById(issueId);

    if (!issue) {
        throw new NotFoundError("Issue not found");
    }

    // Only admin or issue creator can delete
    if (!isAdmin && issue.userId !== userId) {
        throw new UnauthorizedError("You don't have permission to delete this issue");
    }

    await issueModel.findByIdAndDelete(issueId);
    await commentModel.deleteMany({ issueId });
};

export const upvoteIssue = async (issueId: string, userId: string): Promise<Issue> => {
    const issue = await issueModel.findById(issueId);

    if (!issue) {
        throw new NotFoundError("Issue not found");
    }

    const upvotedBy = issue.upvotedBy || [];
    const hasUpvoted = upvotedBy.includes(userId);

    if (hasUpvoted) {
        // Remove upvote
        issue.upvotedBy = upvotedBy.filter(id => id !== userId);
        issue.upvotes = Math.max(0, (issue.upvotes || 0) - 1);
    } else {
        // Add upvote
        issue.upvotedBy = [...upvotedBy, userId];
        issue.upvotes = (issue.upvotes || 0) + 1;
    }

    issue.updatedAt = Date.now();
    await issue.save();

    return issue.toObject();
};

