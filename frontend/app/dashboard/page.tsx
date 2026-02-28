'use client';

import { NavBar } from '@/components/ui/navBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="text-accent">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Browse Questions',
    desc: 'Explore curated technical interview prompts across categories, difficulty levels, and company style focus areas.',
    meta: '42 new questions this week',
    action: 'Explore questions',
    href: '/questions',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="text-accent">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 19c.6-2.7 3-4 5.5-4s4.8 1.3 5.4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Start Matching',
    desc: 'Jump into a peer session in minutes and solve live interview questions together in a shared editor.',
    meta: 'Average match time: 1m 12s',
    action: 'Find a match',
    href: '/matching',
  },
];

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) return <Skeleton/>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar activePage="dashboard" />

      <div className="px-10 py-8 pb-16 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-[22px] font-semibold text-foreground mb-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Welcome back, Alex!
            </h1>
            <p className="text-[12.5px] text-muted-foreground">What would you like to do today?</p>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] bg-card border-border text-muted-foreground shadow-[var(--shadow-sm)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            Not in a session
          </Badge>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {actionCards.map(({ icon, title, desc, meta, action, href }) => (
            <Card
              key={title}
              className="min-h-[240px] flex flex-col border-border shadow-[var(--shadow)] hover:shadow-[var(--shadow-xl)] transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center mb-2">
                  {icon}
                </div>
                <CardTitle
                  className="text-[15px] font-semibold"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-[11.5px] text-muted-foreground">
                  {meta}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow)] text-[12px]"
                >
                  <a href={href}>{action}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-3">Recent Activity</p>
          <Card className="border-border shadow-[var(--shadow)]">
            <CardContent className="pt-4 pb-3 grid gap-2">
              {activityItems.map(({ title, topic, duration, lang, completed }) => (
                <div
                  key={`${title}-${topic}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground truncate">
                      {title}
                      <span className="text-muted-foreground font-normal"> · {topic}</span>
                    </p>
                    <p className={`text-[11.5px] mt-0.5 ${completed ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                      {completed ? 'Completed' : 'Not completed'} · {duration} · {lang}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] whitespace-nowrap rounded-full px-2.5 shrink-0 ${
                      completed
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-destructive bg-destructive/10 border-destructive/25'
                    }`}
                  >
                    {completed ? 'Completed' : 'Not completed'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}