// Domain types

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Generic API types

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
