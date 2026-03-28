'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AiSidebarToggleProps {
  onClick: () => void;
  visible: boolean;
}

export function AiSidebarToggle({ onClick, visible }: AiSidebarToggleProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Open AI Assistant"
            className={`fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground shadow-[var(--shadow)] transition-all duration-200 ease-out hover:border-accent/30 hover:bg-accent/10 hover:text-accent active:scale-95 ${
              visible
                ? 'pointer-events-auto cursor-pointer opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              <path d="M5.6 5.6l2.85 2.85M15.55 15.55l2.85 2.85M5.6 18.4l2.85-2.85M15.55 8.45l2.85-2.85" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="text-xs">AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
