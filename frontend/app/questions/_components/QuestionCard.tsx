'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DifficultyBadge } from './DifficultyBadge';
import { TopicBadge } from './TopicBadge';
import type { Question } from '@/app/questions/types';

interface QuestionCardProps {
    question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
    return (
        <Card className="border-border shadow-[var(--shadow)] p-6 md:p-8 max-w-[920px]">
            {/* Meta badges */}
            <div className="flex items-center gap-2.5 flex-wrap mb-4">
                {question.topics.map((topic) => (
                    <TopicBadge key={topic} topic={topic} />
                ))}
                <DifficultyBadge difficulty={question.difficulty} />
            </div>

            {/* Title */}
            <h2
                className="text-[18px] font-bold text-foreground mb-3"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                {question.title}
            </h2>

            {/* Description */}
            <div className="text-[13px] leading-relaxed text-foreground space-y-3">
                {question.description.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </div>

            {/* Constraints */}
            {question.constraints.length > 0 && (
                <ul className="mt-3 list-disc list-inside text-[13px] text-foreground space-y-1">
                    {question.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                    ))}
                </ul>
            )}

            {/* Examples */}
            {question.examples.map((example, i) => (
                <div
                    key={i}
                    className="mt-5 bg-secondary border border-border rounded-xl p-4"
                >
                    <h3 className="text-[12.5px] uppercase tracking-wide text-muted-foreground font-semibold mb-2.5">
                        Example {question.examples.length > 1 ? i + 1 : 'Input / Output'}
                    </h3>
                    <pre className="text-[12.5px] leading-relaxed font-mono text-foreground whitespace-pre-wrap">
                        {`Input: ${example.input}\nOutput: ${example.output}`}
                        {example.explanation ? `\nExplanation: ${example.explanation}` : ''}
                    </pre>
                </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
                <Button
                    asChild
                    className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[13px] font-semibold px-5"
                >
                    <Link href="/matching">Attempt with Peer</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="rounded-lg text-[13px] font-semibold px-4 border-border hover:bg-secondary hover:text-foreground"
                >
                    <Link href="/questions">Back to Questions</Link>
                </Button>
            </div>
        </Card>
    );
}
