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
                    className="text-[11.5px] rounded-lg h-auto py-1.5 px-3"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-[11.5px] rounded-lg h-auto py-1.5 px-3"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
