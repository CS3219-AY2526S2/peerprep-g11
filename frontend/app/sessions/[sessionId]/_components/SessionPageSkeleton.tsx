'use client';

import { NavBar } from '@/components/ui/navBar';
import { Skeleton } from '@/components/ui/skeleton';

export function SessionPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <div className="mx-auto max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[280px_160px]">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-10 rounded-full" />
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
