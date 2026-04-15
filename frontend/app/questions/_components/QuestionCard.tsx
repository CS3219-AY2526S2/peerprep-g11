'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { DifficultyBadge } from './DifficultyBadge';
import { TopicBadge } from './TopicBadge';
import type { Question } from '@/app/questions/types';

interface QuestionCardProps {
    question: Question;
    showBackLink?: boolean;
    backHref?: string;
    bare?: boolean;
}

export function QuestionCard({
    question,
    showBackLink = true,
    backHref = '/questions',
    bare = false,
}: QuestionCardProps) {
    const descriptionParagraphs = question.description
        .split('\n')
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    const content = (
        <>
            <div className="flex items-center gap-2 flex-wrap mb-4">
                <DifficultyBadge difficulty={question.difficulty} />
                {question.topics.map((topic) => (
                    <TopicBadge key={topic} topic={topic} />
                ))}
            </div>

            <h2
                className="text-[20px] font-bold text-foreground mb-3"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                {question.title}
            </h2>

            {descriptionParagraphs.length > 0 ? (
                <div className="text-[13.5px] leading-relaxed text-foreground space-y-3">
                    {descriptionParagraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            ) : null}

            {question.constraints.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-[12px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                        Constraints
                    </h3>
                    <ul className="list-disc list-inside text-[13px] text-muted-foreground space-y-1.5">
                        {question.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            )}

            {question.examples.map((example, i) => (
                <div
                    key={i}
                    className="mt-5 bg-secondary border border-border rounded-xl p-4"
                >
                    <h3 className="text-[12px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                        Example {question.examples.length > 1 ? i + 1 : 'Input / Output'}
                    </h3>
                    <pre className="text-[12.5px] leading-relaxed font-mono text-foreground whitespace-pre-wrap">
                        {`Input: ${example.input}\nOutput: ${example.output}`}
                        {example.explanation ? `\nExplanation: ${example.explanation}` : ''}
                    </pre>
                </div>
            ))}

            {showBackLink ? (
                <div className="flex gap-3 mt-6">
                    <Link
                        href={backHref}
                        className="group/back inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold px-4 py-2
                            border border-border bg-card text-foreground no-underline
                            transition-all duration-200 ease-out
                            hover:bg-secondary hover:text-foreground hover:shadow-sm
                            active:scale-[0.97] active:shadow-none"
                    >
                        <svg
                            viewBox="0 0 16 16"
                            width="12"
                            height="12"
                            fill="none"
                            className="transition-transform duration-200 group-hover/back:-translate-x-0.5"
                        >
                            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Questions
                    </Link>
                </div>
            ) : null}
        </>
    );

    if (bare) {
        return <div className="px-4 py-4 md:px-5 md:py-5">{content}</div>;
    }

    return (
        <Card className="border-border shadow-[var(--shadow)] p-6 md:p-8 transition-shadow duration-300 hover:shadow-md">
            {content}
        </Card>
    );
}
