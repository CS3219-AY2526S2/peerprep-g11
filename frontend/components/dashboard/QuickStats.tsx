'use client';

// TODO: Replace with actual user stats from API
const stats = [
    { label: 'Sessions', value: '12', sub: 'completed' },
    { label: 'Questions', value: '34', sub: 'solved' },
    { label: 'Streak', value: '5', sub: 'day' },
    { label: 'Avg', value: '28m', sub: 'per session' },
];

export function QuickStats() {
    return (
        <div
            className="flex items-center gap-6 mb-6 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
        >
            {stats.map(({ label, value, sub }, i) => (
                <div
                    key={label}
                    className="flex items-baseline gap-1.5 group cursor-default"
                >
                    <span
                        className="text-[20px] font-semibold text-accent tabular-nums tracking-tight transition-transform duration-200 group-hover:scale-110 origin-bottom-left"
                        style={{ fontFamily: 'var(--font-serif)' }}
                    >
                        {value}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        {label}
                        {i < stats.length - 1 && (
                            <span className="ml-5 text-border select-none">·</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}
