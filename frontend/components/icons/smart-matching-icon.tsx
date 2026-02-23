export function SmartMatchingIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className ?? "size-10 text-accent"}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
            <circle
                cx="15.5"
                cy="10.5"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M4.5 19c.7-3 3.2-4.5 5.8-4.5s5 1.5 5.6 4.5"
                stroke="currentColor"
                strokeWidth="1.6"
            />
        </svg>
    );
}
