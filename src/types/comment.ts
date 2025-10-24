export interface Comment {
    _id?: string;
    userId: string;
    issueId: string;
    comment: string;
    createdAt: number;
    uploadUrls?: string[];
    isAdmin?: boolean;
}