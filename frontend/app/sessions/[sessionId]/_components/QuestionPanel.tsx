'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Question } from '@/app/questions/types';
import { MarkdownText } from './MarkdownText';

interface QuestionPanelProps {
  question: Question;
}

export function QuestionPanel({ question }: QuestionPanelProps) {
  return (
    <Card className="border-border bg-card shadow-[var(--shadow)]">
      <CardHeader className="gap-4 pb-0">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Question
          </p>
          <CardTitle
            className="text-[24px] leading-tight text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {question.title}
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.topics.map((topic) => (
            <Badge
              key={topic}
              variant="outline"
              className="rounded-full border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent"
            >
              {topic}
            </Badge>
          ))}
          <Badge
            variant="outline"
            className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700"
          >
            {question.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5">
        <section className="grid gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">Description</h2>
          <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3 text-[12.5px] leading-7 text-muted-foreground">
            <MarkdownText content={question.description} className="grid gap-4" />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[13px] font-semibold text-foreground">Examples</h2>
          <div className="grid gap-3">
            {question.examples.map((example, index) => (
              <div
                key={`${example.input}-${index}`}
                className="rounded-2xl border border-border bg-secondary/35 px-4 py-3"
              >
                <p className="mb-2 text-[12px] font-semibold text-foreground">Example {index + 1}</p>
                <div className="grid gap-2 text-[12px] leading-6 text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Input:</span>{' '}
                    <MarkdownText content={example.input} inline />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Output:</span>{' '}
                    <MarkdownText content={example.output} inline />
                  </div>
                  {example.explanation ? (
                    <div>
                      <span className="font-semibold text-foreground">Explanation:</span>{' '}
                      <MarkdownText content={example.explanation} inline />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[13px] font-semibold text-foreground">Constraints</h2>
          <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3">
            <ul className="grid gap-2 text-[12px] leading-6 text-muted-foreground">
              {question.constraints.map((constraint) => (
                <li key={constraint} className="flex gap-2">
                  <span className="mt-[9px] inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <MarkdownText content={constraint} inline />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
