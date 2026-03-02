'use client';

interface PreferenceSummaryBadgeProps {
    label: string;
    value: string;
}

export function PreferenceSummaryBadge({ label, value }: PreferenceSummaryBadgeProps) {
    return (
        <div className="bg-accent/10 border border-border rounded-xl px-3 py-2.5">
            <p className="text-[11.5px] font-semibold text-muted-foreground mb-1">{label}</p>
            <p className="text-[12.5px] font-semibold text-foreground">{value}</p>
        </div>
    );
}
