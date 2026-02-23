export function RealTimeIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className ?? "size-10 text-accent"}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
