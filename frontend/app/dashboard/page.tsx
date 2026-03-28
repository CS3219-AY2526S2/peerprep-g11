'use client';

import Link from 'next/link';
import { NavBar } from '@/components/ui/navBar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';

const activityItems = [
  { title: 'Matched with Priya', topic: 'Graphs', duration: '38 minutes', lang: 'Python', completed: true },
  { title: 'Matched with Ethan', topic: 'System Design', duration: '12 minutes', lang: 'Java', completed: false },
  { title: 'Matched with Amira', topic: 'Dynamic Programming', duration: '52 minutes', lang: 'Python', completed: true },
];

const actionCards = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-accent">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Browse Questions',
    desc: 'Explore curated technical interview prompts across categories, difficulty levels, and company focus areas.',
    features: ['Filter by topic & difficulty', 'Company-style focus areas', 'Detailed solution breakdowns'],
    action: 'Explore questions',
    href: '/questions',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-accent">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 19c.6-2.7 3-4 5.5-4s4.8 1.3 5.4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Start Matching',
    desc: 'Jump into a peer session in minutes and solve live interview questions together in a shared editor.',
    features: ['Real-time collaborative editor', 'Choose your language & topic', 'Instant peer matching'],
    action: 'Find a match',
    href: '/matching',
  },
];

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) return <Skeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar activePage="dashboard" />

      <div className="px-8 pt-22 pb-12 max-w-[960px] mx-auto">
        <div className="flex items-end justify-between mb-5 animate-fade-in-up">
          <div>
            <h1
              className="text-[22px] font-semibold text-foreground mb-0.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Welcome back, {user.username}!
            </h1>
            <p className="text-[12.5px] text-muted-foreground">What would you like to do today?</p>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] bg-card border-border text-muted-foreground shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            Not in a session
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {actionCards.map(({ icon, title, desc, features, action, href }, i) => (
            <Card
              key={title}
              className="group flex flex-col
                border-border shadow-sm
                transition-all duration-300 ease-out
                hover:-translate-y-[3px] hover:shadow-xl
                hover:ring-2 hover:ring-accent/10 hover:border-accent/20
                active:scale-[0.98] active:shadow-md
                animate-fade-in-up px-2"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <CardHeader className="pb-1.5 pt-5 px-5">
                <div className="w-9 h-9 rounded-lg bg-accent-soft grid place-items-center mb-1.5 transition-transform duration-250 group-hover:scale-110">
                  {icon}
                </div>
                <CardTitle
                  className="text-[15px] font-semibold"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 px-5 pb-2">
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{desc}</p>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[11.5px] text-foreground/70">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="text-accent shrink-0">
                        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-2">
                <Link
                  href={href}
                  className="group/btn relative inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full
                    bg-accent text-white text-[12.5px] font-medium
                    shadow-[0_2px_12px_-3px_oklch(0.50_0.08_180_/_0.4)]
                    hover:shadow-[0_4px_20px_-4px_oklch(0.50_0.08_180_/_0.5)]
                    hover:brightness-110 hover:scale-[1.01]
                    transition-all duration-300 ease-out
                    overflow-hidden no-underline"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <span className="relative z-10">{action}</span>
                  <span className="relative z-10 w-6 h-6 rounded-full bg-white/20 grid place-items-center transition-all duration-200 group-hover/btn:bg-white/30 group-hover/btn:scale-110">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <p className="text-[13px] font-semibold text-foreground mb-2.5">Recent Activity</p>
          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="pt-3 pb-2 grid gap-1">
              {activityItems.map(({ title, topic, duration, lang, completed }, i) => (
                <Link
                  key={`${title}-${topic}`}
                  href="#"
                  className="group/row relative flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg
                    bg-secondary/30 border border-transparent
                    transition-colors duration-200 ease-out
                    hover:bg-secondary hover:border-border
                    no-underline
                    animate-fade-in-up"
                  style={{ animationDelay: `${350 + i * 60}ms` }}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full bg-accent transition-all duration-200 group-hover/row:h-6" />

                  <div className="min-w-0 pl-2">
                    <p className="text-[12.5px] font-semibold text-foreground truncate">
                      {title}
                      <span className="text-muted-foreground font-normal"> · {topic}</span>
                    </p>
                    <p className={`text-[11px] mt-0.5 ${completed ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                      {completed ? 'Completed' : 'Not completed'} · {duration} · {lang}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10.5px] whitespace-nowrap rounded-full px-2.5 ${completed
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-destructive bg-destructive/10 border-destructive/25'
                        }`}
                    >
                      {completed ? 'Completed' : 'Not completed'}
                    </Badge>
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      className="text-muted-foreground/0 transition-all duration-200 group-hover/row:text-muted-foreground"
                    >
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
