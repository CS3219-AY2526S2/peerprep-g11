'use client';

import { Badge } from '@/components/ui/badge';
import type { QuestionStatus } from '@/app/questions/types';

const statusConfig: Record<QuestionStatus, { className: string }> = {
    Completed: {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    'In Review': {
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    Pending: {
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
};

interface StatusPillProps {
    status: QuestionStatus;
}

export function StatusPill({ status }: StatusPillProps) {
    const config = statusConfig[status];
    return (
        <Badge
            variant="outline"
            className={`rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${config.className}`}
        >
            {status}
        </Badge>
    );
}
