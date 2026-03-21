'use client';

import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';

export function SessionPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <div className="mx-auto max-w-[1680px] px-5 pt-24 pb-6 sm:px-8 lg:px-10 lg:pb-8">
        <div className="mb-6 grid gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[620px] space-y-2">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-4 w-full max-w-[520px]" />
              <Skeleton className="h-4 w-4/5 max-w-[460px]" />
            </div>

            <div className="flex items-center gap-4 self-start rounded-[15px] border border-border bg-card px-4 py-2 shadow-[var(--shadow)]">
              <Skeleton className="h-8 w-16 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-9 w-20 rounded-[10px]" />
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
          <Skeleton className="h-[720px] rounded-3xl" />
          <Skeleton className="h-[720px] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
