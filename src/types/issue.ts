export interface Issue {
    _id?: string;
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
    createdAt: number;
    updatedAt: number;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
}