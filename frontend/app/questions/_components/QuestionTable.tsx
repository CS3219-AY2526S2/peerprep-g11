'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
                    {questions.map((q) => (
                        <TableRow key={q.id} className="hover:bg-secondary/50 transition-colors border-border">
                            <TableCell className="text-[12.5px] font-medium text-foreground">
                                {q.title}
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
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg text-[11.5px] font-semibold h-auto py-1.5 px-3 border-border hover:bg-secondary hover:text-foreground"
                                >
                                    <Link href={`/questions/${q.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
