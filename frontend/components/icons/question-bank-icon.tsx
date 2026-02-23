export function QuestionBankIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className ?? "size-10 text-accent"}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M6 5h11a2 2 0 012 2v12"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M6 5a2 2 0 00-2 2v12a2 2 0 002 2h11"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path d="M6 5v14" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
