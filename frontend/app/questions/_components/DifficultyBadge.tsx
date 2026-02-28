'use client';

import { Badge } from '@/components/ui/badge';
import type { Difficulty } from '@/lib/types';

const difficultyConfig: Record<Difficulty, { className: string }> = {
    Easy: {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    Medium: {
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    Hard: {
        className: 'bg-red-50 text-red-700 border-red-200',
    },
};

interface DifficultyBadgeProps {
    difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
    const config = difficultyConfig[difficulty];
    return (
        <Badge
            variant="outline"
            className={`rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${config.className}`}
        >
            {difficulty}
        </Badge>
    );
}
