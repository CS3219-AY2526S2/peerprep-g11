import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            className={cn("w-[26px] h-[26px] text-foreground", className)}
            aria-hidden="true"
        >
            <path d="M4 8L12 16L4 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="14.5" y1="22" x2="17.5" y2="10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 8L20 16L28 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
