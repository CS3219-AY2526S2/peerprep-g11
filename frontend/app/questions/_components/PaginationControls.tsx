'use client';

import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between mt-4">
            <p className="text-[11.5px] text-muted-foreground">
                Showing {start}–{end} of {total} questions
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-[11.5px] rounded-lg h-auto py-1.5 px-3 border-border
                        transition-all duration-150 ease-out
                        hover:bg-secondary hover:border-border hover:shadow-sm
                        active:scale-[0.97] active:shadow-none
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="mr-1">
                        <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-[11.5px] rounded-lg h-auto py-1.5 px-3 border-border
                        transition-all duration-150 ease-out
                        hover:bg-secondary hover:border-border hover:shadow-sm
                        active:scale-[0.97] active:shadow-none
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="ml-1">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Button>
            </div>
        </div>
    );
}
