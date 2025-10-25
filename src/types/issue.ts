export interface Issue {
    _id?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    userId: string;
    title: string;
    description: string;
    uploadUrls: string[];
    category: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    upvotes?: number;
    upvotedBy?: string[];
    resolutionMessage?: string;
    resolutionUploadUrls?: string[];
    resolvedAt?: number;
    createdAt: number;
    updatedAt: number;
}