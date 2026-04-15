'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DifficultyBadge } from '@/app/questions/_components/DifficultyBadge';
import type { QuestionListElement } from '@/app/questions/types';

interface AdminQuestionTableProps {
  questions: QuestionListElement[];
  isEditMode: boolean;
  selectedSlugs: string[];
  onToggleSelection: (slug: string, checked: boolean) => void;
}

export function AdminQuestionTable({
  questions,
  isEditMode,
  selectedSlugs,
  onToggleSelection,
}: AdminQuestionTableProps) {
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
            {isEditMode ? (
              <TableHead className="w-[48px] text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
                Select
              </TableHead>
            ) : null}
            <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
              Question Title
            </TableHead>
            <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
              Topics
            </TableHead>
            <TableHead className="text-[11.5px] uppercase tracking-wide text-muted-foreground font-semibold">
              Difficulty
            </TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question, index) => {
            const isSelected = selectedSlugs.includes(question.slug);

            return (
              <TableRow
                key={question.id}
                className="group/row relative hover:bg-secondary/50 transition-all duration-200 border-border animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {isEditMode ? (
                  <TableCell className="w-[48px]">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelection(question.slug, checked === true)}
                      aria-label={`Select ${question.title}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell className="relative text-[12.5px] font-medium text-foreground">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-accent transition-all duration-200 group-hover/row:h-6" />
                  <span className="pl-2">{question.title}</span>
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {question.topics.join(', ')}
                </TableCell>
                <TableCell>
                  <DifficultyBadge difficulty={question.difficulty} />
                </TableCell>
                <TableCell className="w-[100px]">
                  <Link
                    href={`/admin/questions/${question.slug}`}
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
                        <path
                          d="M6 3l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
