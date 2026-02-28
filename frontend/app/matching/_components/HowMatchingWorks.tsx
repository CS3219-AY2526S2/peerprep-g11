'use client';

const items = [
    "Your topic and difficulty must align with another user's selections.",
    'A language match ensures both of you can collaborate in the same editor.',
    "Once paired, you'll move directly into a shared coding session.",
];

export function HowMatchingWorks() {
    return (
        <div className="bg-secondary border border-border rounded-xl p-5 w-full max-w-[360px] grid gap-3">
            <p
                className="text-[12.5px] font-bold text-foreground"
                style={{ fontFamily: 'var(--font-serif)' }}
            >
                How matching works
            </p>
            {items.map((text) => (
                <div key={text} className="flex gap-2.5 text-[11.5px] text-muted-foreground leading-relaxed">
                    <span className="mt-[5px] w-2 h-2 rounded-full bg-accent shrink-0" />
                    <span>{text}</span>
                </div>
            ))}
        </div>
    );
}
