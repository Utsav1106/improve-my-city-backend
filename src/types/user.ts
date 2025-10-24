export interface User {
    _id?: string;
    email: string;
    password: string;
    name: string;
    data: Record<string, any>
}