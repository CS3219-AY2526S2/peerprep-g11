'use client';

import { Badge } from '@/components/ui/badge';

interface TopicBadgeProps {
    topic: string;
}

export function TopicBadge({ topic }: TopicBadgeProps) {
    return (
        <Badge
            variant="outline"
            className="rounded-full text-[11px] font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
        >
            {topic}
        </Badge>
    );
}
