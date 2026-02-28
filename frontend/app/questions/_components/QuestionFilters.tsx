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
    // Debounced search: local input state syncs to parent after 300ms
    const [localSearch, setLocalSearch] = useState(search);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep local state in sync if parent resets search externally
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[2.4fr_1fr_1fr] gap-3.5">
            {/* Search Input */}
            <div className="bg-card border border-border rounded-xl px-3.5 py-3.5 flex items-center gap-2.5 shadow-[var(--shadow)]">
                <label
                    htmlFor="question-search"
                    className="text-[12.5px] font-semibold text-muted-foreground whitespace-nowrap leading-none"
                >
                    Search
                </label>
                <Input
                    id="question-search"
                    type="text"
                    placeholder="e.g. binary search, graphs, DP"
                    value={localSearch}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 text-sm h-auto py-0 pl-2 pr-0 bg-transparent leading-relaxed selection:bg-primary/20 selection:text-foreground"
                />
            </div>

            {/* Topic Filter */}
            <div className="bg-card border border-border rounded-xl px-3.5 py-1 flex items-center gap-2.5 shadow-[var(--shadow)] transition-all duration-200 ease-out hover:border-ring/30 hover:shadow-md active:shadow-[var(--shadow),inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer">
                <label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                    Topic
                </label>
                <Select value={topic} onValueChange={onTopicChange}>
                    <SelectTrigger className="border-none shadow-none focus:ring-0 text-[12.5px] h-auto p-0 bg-transparent flex-1">
                        <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="bg-card border border-border rounded-xl px-3.5 py-1 flex items-center gap-2.5 shadow-[var(--shadow)] transition-all duration-200 ease-out hover:border-ring/30 hover:shadow-md active:shadow-[var(--shadow),inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer">
                <label className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                    Difficulty
                </label>
                <Select value={difficulty} onValueChange={onDifficultyChange}>
                    <SelectTrigger className="border-none shadow-none focus:ring-0 text-[12.5px] h-auto p-0 bg-transparent flex-1">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
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
