export interface User {
    _id?: string;
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
    createdAt: number;
    data: Record<string, any>
}