'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Difficulty } from '@/lib/types';

interface QuestionFiltersProps {
    search: string;
    topic: string;
    difficulty: string;
    topics: string[];
    onSearchChange: (value: string) => void;
    onTopicChange: (value: string) => void;
    onDifficultyChange: (value: string) => void;
}

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export function QuestionFilters({
    search,
    topic,
    difficulty,
    topics,
    onSearchChange,
    onTopicChange,
    onDifficultyChange,
}: QuestionFiltersProps) {
    // Debounce parent updates so we don't refetch on every keystroke.
    const [localSearch, setLocalSearch] = useState(search);
    const [searchFocused, setSearchFocused] = useState(false);
    const [topicOpen, setTopicOpen] = useState(false);
    const [difficultyOpen, setDifficultyOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mirror external search resets back into the local input.
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    const handleSearchInput = (value: string) => {
        setLocalSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearchChange(value);
        }, 300);
    };

    // Clear any pending debounce before unmounting.
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[2.4fr_1fr_1fr] gap-3">
            <div
                className={`bg-card border rounded-xl px-3.5 py-3 flex items-center gap-2.5 shadow-[var(--shadow)]
                    transition-all duration-200 ease-out cursor-text
                    ${searchFocused
                        ? 'border-accent/40 ring-2 ring-accent/10 shadow-md'
                        : 'border-border hover:border-ring/30 hover:shadow-md'
                    }`}
                onClick={() => document.getElementById('question-search')?.focus()}
            >
                <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="none"
                    className={`shrink-0 transition-all duration-200 ${searchFocused ? 'text-accent scale-110' : 'text-muted-foreground'
                        }`}
                >
                    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M13.5 13.5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <label
                    htmlFor="question-search"
                    className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap leading-none cursor-text"
                >
                    Search
                </label>
                <Input
                    id="question-search"
                    type="text"
                    placeholder="e.g. binary search, graphs, DP"
                    value={localSearch}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="border-none shadow-none focus-visible:ring-0 text-sm h-auto py-0 pl-1.5 pr-0 bg-transparent leading-relaxed selection:bg-primary/20 selection:text-foreground"
                />
            </div>

            <div className={`bg-card border rounded-xl px-3.5 py-1 flex items-center gap-2.5 shadow-[var(--shadow)] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${topicOpen
                    ? 'border-accent/40 ring-2 ring-accent/10 shadow-md'
                    : 'border-border hover:border-ring/30 hover:shadow-md'
                }`}>
                <label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                    Topic
                </label>
                <Select value={topic} onValueChange={onTopicChange} onOpenChange={setTopicOpen}>
                    <SelectTrigger className="border-none shadow-none focus:ring-0 text-[12.5px] h-auto p-0 bg-transparent flex-1 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                        <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className={`bg-card border rounded-xl px-3.5 py-1 flex items-center gap-2.5 shadow-[var(--shadow)] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${difficultyOpen
                    ? 'border-accent/40 ring-2 ring-accent/10 shadow-md'
                    : 'border-border hover:border-ring/30 hover:shadow-md'
                }`}>
                <label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                    Difficulty
                </label>
                <Select value={difficulty} onValueChange={onDifficultyChange} onOpenChange={setDifficultyOpen}>
                    <SelectTrigger className="border-none shadow-none focus:ring-0 text-[12.5px] h-auto p-0 bg-transparent flex-1 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                        <SelectItem value="all">All Levels</SelectItem>
                        {DIFFICULTIES.map((d) => (
                            <SelectItem key={d} value={d}>
                                {d}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
