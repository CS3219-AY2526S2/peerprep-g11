import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PeerPrepLogo = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-[26px] h-[26px]">
    <rect x="3" y="3" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="2" />
    <path d="M9 12l7-4 7 4-7 4-7-4z" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M9 12v8l7 4 7-4v-8" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-accent">
        <path d="M6 5h11a2 2 0 012 2v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6 5a2 2 0 00-2 2v12a2 2 0 002 2h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6 5v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10 11h6M10 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Question Bank',
    sub: 'Curated prompts across categories, difficulty levels, and company styles.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-accent">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="15.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 19c.7-3 3.2-4.5 5.8-4.5s5 1.5 5.6 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Smart Matching',
    sub: 'Get paired with a peer in under two minutes, matched by topic and skill.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-accent">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Real-Time Sessions',
    sub: 'Live collaboration with a shared code editor and synchronized timer.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center gap-3 px-7 py-5 border-b border-border bg-card">
        <PeerPrepLogo />
        <span className="font-semibold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
          PeerPrep
        </span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 gap-8">
        <div className="max-w-[580px] grid gap-4">
          <h1
            className="text-[38px] leading-[1.15] font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Practice technical interviews<br />
            <em className="not-italic text-accent">with a real peer.</em>
          </h1>
          <p className="text-muted-foreground text-[13.5px] leading-relaxed max-w-[460px] mx-auto">
            Build confidence through live peer sessions. Choose a topic, get matched in minutes, and
            solve real interview questions together in a shared editor.
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="min-w-[130px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-lg)] h-10 text-[13px]"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-w-[130px] bg-card border-border text-foreground hover:bg-secondary h-10 text-[13px]"
          >
            <Link href="/create-account">Create Account</Link>
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-5 mt-4 max-w-[680px] w-full">
          {features.map(({ icon, title, sub }) => (
            <Card key={title} className="text-left shadow-[var(--shadow)] border-border">
              <CardContent className="pb-5 px-5 flex flex-col gap-3 items-center">
                {icon}
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">{sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}