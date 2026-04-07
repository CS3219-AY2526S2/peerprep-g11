'use client';

const steps = [
    {
        num: '1',
        title: 'Set preferences',
        desc: 'Choose your topic, difficulty level, and programming language.',
    },
    {
        num: '2',
        title: 'Enter the queue',
        desc: 'We\u2019ll search for a peer with matching preferences for up to 2 minutes.',
    },
    {
        num: '3',
        title: 'Get matched',
        desc: 'Once a peer is found, you\u2019ll both enter a shared coding session instantly.',
    },
];

export function HowMatchingWorks() {
    return (
        <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] mb-5 select-none">
                How it works
            </p>

            <div className="relative">
                {steps.map((step, i) => (
                    <div key={step.num} className="flex gap-4 group">
                        {/* Timeline column */}
                        <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent text-[11px] font-bold grid place-items-center shrink-0 transition-colors duration-200 group-hover:bg-accent/20">
                                {step.num}
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-px flex-1 bg-border my-1.5" />
                            )}
                        </div>

                        {/* Content */}
                        <div className={i < steps.length - 1 ? 'pb-6' : 'pb-0'}>
                            <p className="text-[13px] font-semibold text-foreground leading-none mt-1">
                                {step.title}
                            </p>
                            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1.5">
                                {step.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subtle contextual note */}
            <div className="mt-7 pt-5 border-t border-border">
                <div className="flex items-start gap-2.5">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" className="text-muted-foreground/40 shrink-0 mt-px">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-[11.5px] text-muted-foreground/60 leading-relaxed">
                        Both users must select the same topic and language to be matched.
                    </p>
                </div>
            </div>
        </div>
    );
}
