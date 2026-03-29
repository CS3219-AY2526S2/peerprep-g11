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
import type { TopicDifficulties } from '@/app/matching/types';

const ALL_DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const EMPTY_DIFFICULTIES: Difficulty[] = [];

interface MatchingPreferencesFormProps {
    topics: string[];
    topicDifficulties: TopicDifficulties;
    onSubmit: (preferences: MatchingPreferences) => void;
    isSubmitting?: boolean;
}

export function MatchingPreferencesForm({
    topics,
    topicDifficulties,
    onSubmit,
    isSubmitting,
}: MatchingPreferencesFormProps) {
    const [topic, setTopic] = useState<string>('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [language, setLanguage] = useState<ProgrammingLanguage>(PROGRAMMING_LANGUAGES[0]);
    const selectedTopic = topics.includes(topic) ? topic : (topics[0] ?? '');
    const availableDifficulties = selectedTopic
        ? (topicDifficulties[selectedTopic] ?? EMPTY_DIFFICULTIES)
        : EMPTY_DIFFICULTIES;
    const selectedDifficulty = availableDifficulties.includes(difficulty)
        ? difficulty
        : (availableDifficulties[0] ?? difficulty);
    const hasAvailableDifficulty = availableDifficulties.includes(selectedDifficulty);
    const canSubmit = Boolean(selectedTopic) && hasAvailableDifficulty && availableDifficulties.length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({ topic: selectedTopic, difficulty: selectedDifficulty, language });
    };

    return (
        <Card className="w-full max-w-[520px] p-5 shadow-[var(--shadow)] border-border">
            <div className="grid gap-4">
                <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-all duration-200 ease-out hover:border-ring/30 hover:shadow-md active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer">
                    <Label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                        Topic
                    </Label>
                    <Select
                        value={selectedTopic}
                        onValueChange={setTopic}
                        disabled={topics.length === 0}
                    >
                        <SelectTrigger className="border-none shadow-none p-0 h-auto text-[12.5px] text-foreground focus:ring-0 w-auto gap-1.5 [&>svg]:opacity-50">
                            <SelectValue placeholder={topics.length > 0 ? 'Select Topic' : 'No Topics Available'} />
                        </SelectTrigger>
                        <SelectContent>
                            {topics.map((t) => (
                                <SelectItem key={t} value={t} className="text-[12.5px]">
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-2">
                    <Label className="text-[11.5px] font-semibold text-muted-foreground">Difficulty</Label>
                    <RadioGroup
                        value={selectedDifficulty}
                        onValueChange={(v) => setDifficulty(v as Difficulty)}
                        className="flex gap-2.5"
                    >
                        {ALL_DIFFICULTIES.map((d) => {
                            const isAvailable = availableDifficulties.includes(d);

                            return (
                            <Label
                                key={d}
                                htmlFor={`difficulty-${d}`}
                                aria-disabled={!isAvailable}
                                className={`flex-1 flex items-center justify-center gap-2 border rounded-full px-3 py-2 text-[12px] font-semibold transition-all duration-200 ease-out ${isAvailable
                                    ? `cursor-pointer active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] ${selectedDifficulty === d
                                        ? 'border-accent bg-accent/10 text-accent shadow-[0_0_0_1px_hsl(var(--accent)/0.15)]'
                                        : 'border-border bg-card text-accent hover:bg-secondary hover:border-ring/30 hover:shadow-sm'
                                    }`
                                    : 'cursor-not-allowed border-border bg-muted/40 text-muted-foreground/70'
                                    }`}
                            >
                                <RadioGroupItem
                                    value={d}
                                    id={`difficulty-${d}`}
                                    className="sr-only"
                                    disabled={!isAvailable}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedDifficulty === d && isAvailable
                                        ? 'border-accent'
                                        : 'border-muted-foreground/40'
                                        }`}
                                >
                                    {selectedDifficulty === d && isAvailable && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                                </span>
                                {d}
                            </Label>
                            );
                        })}
                    </RadioGroup>
                </div>

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

                <div className="flex items-center gap-4 mt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canSubmit}
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
                    {topics.length === 0
                        ? 'Topics are currently unavailable. Please try again once the question service is reachable.'
                        : availableDifficulties.length === 0
                            ? 'No questions are currently available for the selected topic. Please choose another topic.'
                            : "We'll keep you in the matching lobby for up to 2 minutes. If no match is found, you can refine your preferences or try again."}
                </p>
            </div>
        </Card>
    );
}
