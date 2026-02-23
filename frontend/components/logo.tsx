import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            className={cn("size-7", className)}
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="26"
                height="26"
                rx="6"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M9 12l7-4 7 4-7 4-7-4z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M9 12v8l7 4 7-4v-8"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}
