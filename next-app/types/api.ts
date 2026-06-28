// API related types

export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
    success?: boolean;
}

export interface ApiError {
    message: string;
    status: number;
    code?: string;
    details?: any;
    timestamp?: string;
}

export interface ApiMeta {
    pagination?: PaginationMeta;
    total?: number;
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}

export interface StrapiResponse<T = any> {
    data: T;
    meta?: ApiMeta;
}

export interface StrapiEntity {
    id: number;
    documentId: string;
    attributes: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    expiresAt?: number;
}

export interface LoginRequest {
    identifier: string;
    password: string;
    remember?: boolean;
}

export interface LoginResponse {
    jwt: string;
    user: UserProfile;
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
    role?: UserRole;
    profile?: any;
}

export interface UserRole {
    id: number;
    name: string;
    description?: string;
    type: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    jwt: string;
    refreshToken: string;
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T = any> {
    data?: T;
    loading: boolean;
    error?: string;
    lastFetch?: Date;
}