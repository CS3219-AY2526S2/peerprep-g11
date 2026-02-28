'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Difficulty } from '@/lib/types';
import type { MatchingPreferences } from '@/app/matching/types';
import {
    PROGRAMMING_LANGUAGES,
    PROGRAMMING_LANGUAGE_LABELS,
    type ProgrammingLanguage,
} from '@/lib/programming-languages';

// TODO: Fetch from question service
const TOPICS = ['Arrays', 'Graphs', 'Dynamic Programming', 'System Design', 'Data Structures'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

interface MatchingPreferencesFormProps {
    onSubmit: (preferences: MatchingPreferences) => void;
    isSubmitting?: boolean;
}

export function MatchingPreferencesForm({ onSubmit, isSubmitting }: MatchingPreferencesFormProps) {
    const [topic, setTopic] = useState<string>(TOPICS[0]);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [language, setLanguage] = useState<ProgrammingLanguage>(PROGRAMMING_LANGUAGES[0]);

    const handleSubmit = () => {
        onSubmit({ topic, difficulty, language });
    };

    return (
        <Card className="w-full max-w-[520px] p-5 shadow-[var(--shadow)] border-border">
            <div className="grid gap-4">
                <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-all duration-200 ease-out hover:border-ring/30 hover:shadow-md active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer">
                    <Label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                        Topic
                    </Label>
                    <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger className="border-none shadow-none p-0 h-auto text-[12.5px] text-foreground focus:ring-0 w-auto gap-1.5 [&>svg]:opacity-50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TOPICS.map((t) => (
                                <SelectItem key={t} value={t} className="text-[12.5px]">
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Difficulty */}
                <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-2">
                    <Label className="text-[11.5px] font-semibold text-muted-foreground">Difficulty</Label>
                    <RadioGroup
                        value={difficulty}
                        onValueChange={(v) => setDifficulty(v as Difficulty)}
                        className="flex gap-2.5"
                    >
                        {DIFFICULTIES.map((d) => (
                            <Label
                                key={d}
                                htmlFor={`difficulty-${d}`}
                                className={`flex-1 flex items-center justify-center gap-2 border rounded-full px-3 py-2 text-[12px] font-semibold cursor-pointer transition-all duration-200 ease-out active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] ${difficulty === d
                                    ? 'border-accent bg-accent/10 text-accent shadow-[0_0_0_1px_hsl(var(--accent)/0.15)]'
                                    : 'border-border bg-card text-accent hover:bg-secondary hover:border-ring/30 hover:shadow-sm'
                                    }`}
                            >
                                <RadioGroupItem value={d} id={`difficulty-${d}`} className="sr-only" />
                                <span
                                    className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${difficulty === d ? 'border-accent' : 'border-muted-foreground/40'
                                        }`}
                                >
                                    {difficulty === d && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                                </span>
                                {d}
                            </Label>
                        ))}
                    </RadioGroup>
                </div>

                {/* Language — inline: label left, select right */}
                <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-all duration-200 ease-out hover:border-ring/30 hover:shadow-md active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer">
                    <Label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                        Programming Language
                    </Label>
                    <Select
                        value={language}
                        onValueChange={(value) => setLanguage(value as ProgrammingLanguage)}
                    >
                        <SelectTrigger className="border-none shadow-none p-0 h-auto text-[12.5px] text-foreground focus:ring-0 w-auto gap-1.5 [&>svg]:opacity-50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PROGRAMMING_LANGUAGES.map((l) => (
                                <SelectItem key={l} value={l} className="text-[12.5px]">
                                    {PROGRAMMING_LANGUAGE_LABELS[l]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[13px] font-semibold px-5 py-2.5 rounded-lg"
                    >
                        {isSubmitting ? 'Starting\u2026' : 'Start Matching'}
                    </Button>
                    <Link
                        href="/questions"
                        className="text-[12.5px] text-accent font-semibold hover:underline"
                    >
                        Back to Questions
                    </Link>
                </div>

                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    We&apos;ll keep you in the matching lobby for up to 2 minutes. If no match is found, you
                    can refine your preferences or try again.
                </p>
            </div>
        </Card>
    );
}
