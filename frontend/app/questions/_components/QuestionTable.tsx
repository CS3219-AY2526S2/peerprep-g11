'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusPill } from './StatusPill';
import { DifficultyBadge } from './DifficultyBadge';
import type { Question } from '@/app/questions/types';

interface QuestionTableProps {
    questions: Question[];
}

export function QuestionTable({ questions }: QuestionTableProps) {
    const router = useRouter();

    if (questions.length === 0) {
        return (
            <Card className="border-border shadow-[var(--shadow)] mt-6 p-8 text-center">
                <p className="text-muted-foreground text-[13px]">
                    No questions found. Try adjusting your filters.
                </p>
            </Card>
        );
    }

    return (
        <Card className="border-border shadow-[var(--shadow)] mt-6 overflow-hidden p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary border-border">
                        <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
                            Question Title
                        </TableHead>
                        <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
                            Topics
                        </TableHead>
                        <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
                            Difficulty
                        </TableHead>
                        <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
                            Status
                        </TableHead>
                        <TableHead className="w-[80px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map((q, i) => (
                        <TableRow
                            key={q.id}
                            onClick={() => router.push(`/questions/${q.id}`)}
                            className="group/row relative hover:bg-secondary/50 transition-all duration-200 border-border cursor-pointer animate-fade-in-up"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {/* Left accent bar — dashboard-style reveal on hover */}
                            <TableCell className="relative text-[12.5px] font-medium text-foreground">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-accent transition-all duration-200 group-hover/row:h-6" />
                                <span className="pl-2">{q.title}</span>
                            </TableCell>
                            <TableCell className="text-[12.5px] text-muted-foreground">
                                {q.topics.join(', ')}
                            </TableCell>
                            <TableCell>
                                <DifficultyBadge difficulty={q.difficulty} />
                            </TableCell>
                            <TableCell>
                                <StatusPill status={q.status} />
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/questions/${q.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="group/btn inline-flex items-center rounded-lg text-[11.5px] font-semibold h-auto py-1.5 px-3
                                        border border-border bg-card text-foreground
                                        transition-all duration-200 ease-out no-underline
                                        hover:bg-accent hover:text-white hover:border-accent hover:scale-105 hover:shadow-md
                                        active:scale-95 active:shadow-sm"
                                >
                                    View
                                    <span className="inline-flex w-0 overflow-hidden transition-all duration-200 group-hover/btn:w-4 group-hover/btn:ml-1">
                                        <svg
                                            viewBox="0 0 16 16"
                                            width="12"
                                            height="12"
                                            fill="none"
                                            className="shrink-0 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100"
                                        >
                                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
