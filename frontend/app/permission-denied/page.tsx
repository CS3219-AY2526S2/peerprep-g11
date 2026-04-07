'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PermissionDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-6">
      <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-in-up">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-destructive/[0.07] grid place-items-center">
            <div className="w-14 h-14 rounded-full bg-destructive/[0.09] grid place-items-center">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                className="text-destructive/80"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8 10V7.6C8 5.6 9.8 4 12 4s4 1.6 4 3.6V10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        <p className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-destructive/70 mb-2">
          403 Forbidden
        </p>

        <h1
          className="text-[1.65rem] leading-tight font-semibold text-foreground mb-3"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Permission Denied
        </h1>

        <p className="text-[13px] leading-relaxed text-muted-foreground max-w-xs mb-8">
          You don&apos;t have access to this page. If you believe this is a
          mistake, contact your administrator.
        </p>

        <Button
          onClick={() => router.push('/dashboard')}
          className="text-[12.5px] font-semibold px-5 mb-6"
        >
          Return Home
        </Button>

        <div className="w-10 h-px bg-border mb-4" />

        <p className="text-[10.5px] text-muted-foreground/60 font-mono tracking-wide">
          ERR_PERMISSION_CHECK_FAILED
        </p>
      </div>
    </div>
  );
}
