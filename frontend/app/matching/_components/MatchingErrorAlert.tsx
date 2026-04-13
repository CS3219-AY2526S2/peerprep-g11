'use client';

import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MatchingErrorAlertProps {
    message: string;
    matchId?: string;
}

export function MatchingErrorAlert({
    message,
    matchId,
}: MatchingErrorAlertProps) {
    return (
        <Alert variant="destructive" className="mb-5 rounded-xl">
            <AlertDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                <span>{message}</span>
                {matchId ? (
                    <Link
                        href={`/sessions/${matchId}`}
                        className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
                    >
                        Rejoin session
                    </Link>
                ) : null}
            </AlertDescription>
        </Alert>
    );
}
