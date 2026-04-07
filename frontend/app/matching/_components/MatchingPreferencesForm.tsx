'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Difficulty } from '@/lib/types';
import type { MatchingPreferences, TopicDifficulties } from '@/app/matching/types';
import {
    PROGRAMMING_LANGUAGES,
    PROGRAMMING_LANGUAGE_LABELS,
    type ProgrammingLanguage,
} from '@/lib/programming-languages';

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
        <div className="w-full max-w-[480px] animate-fade-in-up">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <Select
                    value={selectedTopic}
                    onValueChange={setTopic}
                    disabled={topics.length === 0}
                >
                    <SelectTrigger className="w-full border-none shadow-none rounded-none px-5 py-6 data-[size=default]:h-auto text-[13px] font-medium text-foreground focus:ring-0 focus-visible:ring-0 cursor-pointer transition-colors duration-150 hover:bg-secondary/50 active:bg-secondary/70 [&>svg]:opacity-40 [&>svg]:transition-opacity [&>svg]:duration-150 hover:[&>svg]:opacity-70">
                        <span className="text-[12px] font-semibold text-muted-foreground tracking-wide uppercase select-none mr-auto">
                            Topic
                        </span>
                        <SelectValue placeholder={topics.length > 0 ? 'Select topic' : 'No topics available'} />
                    </SelectTrigger>
                    <SelectContent align="end" className="min-w-0 w-auto">
                        {topics.map((t) => (
                            <SelectItem key={t} value={t} className="text-[13px] cursor-pointer">
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="h-px bg-border mx-5" />

                {/* Difficulty row */}
                <div className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-muted-foreground tracking-wide uppercase select-none block mb-3">
                        Difficulty
                    </span>
                    <div className="flex gap-2">
                        {ALL_DIFFICULTIES.map((d) => {
                            const isAvailable = availableDifficulties.includes(d);
                            const isSelected = selectedDifficulty === d && isAvailable;

                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => isAvailable && setDifficulty(d)}
                                    disabled={!isAvailable}
                                    className={`
                                        flex-1 py-2 px-3 rounded-lg text-[12.5px] font-semibold
                                        transition-all duration-150 ease-out select-none
                                        ${isSelected
                                            ? 'bg-accent text-accent-foreground shadow-sm'
                                            : isAvailable
                                                ? 'bg-secondary text-foreground hover:bg-accent/10 hover:text-accent active:scale-[0.97] cursor-pointer'
                                                : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-border mx-5" />

                <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as ProgrammingLanguage)}
                >
                    <SelectTrigger className="w-full border-none shadow-none rounded-none px-5 py-6 data-[size=default]:h-auto text-[13px] font-medium text-foreground focus:ring-0 focus-visible:ring-0 cursor-pointer transition-colors duration-150 hover:bg-secondary/50 active:bg-secondary/70 [&>svg]:opacity-40 [&>svg]:transition-opacity [&>svg]:duration-150 hover:[&>svg]:opacity-70">
                        <span className="text-[12px] font-semibold text-muted-foreground tracking-wide uppercase select-none mr-auto">
                            Language
                        </span>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="min-w-0 w-auto">
                        {PROGRAMMING_LANGUAGES.map((l) => (
                            <SelectItem key={l} value={l} className="text-[13px] cursor-pointer">
                                {PROGRAMMING_LANGUAGE_LABELS[l]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-5 flex items-center gap-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-sm text-[13px] font-semibold px-6 py-2.5 rounded-lg transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Starting\u2026' : 'Start Matching'}
                </Button>
                <Link
                    href="/questions"
                    className="text-[12.5px] text-muted-foreground font-medium hover:text-accent transition-colors duration-150 cursor-pointer"
                >
                    Back to Questions
                </Link>
            </div>

            <p className="mt-4 text-[11.5px] text-muted-foreground leading-relaxed max-w-[400px]">
                {topics.length === 0
                    ? 'Topics are currently unavailable. Please try again once the question service is reachable.'
                    : availableDifficulties.length === 0
                        ? 'No questions available for the selected topic. Please choose another.'
                        : "We\u2019ll search for up to 2 minutes. You can cancel anytime."}
            </p>
        </div>
    );
}
