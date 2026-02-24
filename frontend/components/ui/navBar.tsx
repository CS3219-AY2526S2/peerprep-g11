'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface NavBarProps {
  activePage?: 'dashboard' | 'matching' | 'questions';
}

const PeerPrepLogo = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-[26px] h-[26px] text-foreground">
    <rect x="3" y="3" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="2" />
    <path d="M9 12l7-4 7 4-7 4-7-4z" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M9 12v8l7 4 7-4v-8" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
  { href: '/matching', label: 'Matching', key: 'matching' },
  { href: '/questions', label: 'Questions', key: 'questions' },
] as const;

export function NavBar({ activePage }: NavBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 font-semibold text-foreground no-underline"
      >
        <PeerPrepLogo />
        <span style={{ fontFamily: 'var(--font-serif)' }}>PeerPrep</span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {navLinks.map(({ href, label, key }) => {
          const isActive = activePage === key;
          return (
            <Button
              key={key}
              asChild
              variant="ghost"
              size="sm"
              className={`rounded-2xl text-[12.5px] transition-colors ${
                isActive
                  ? 'bg-accent-soft text-accent font-semibold hover:bg-accent-soft'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Link href={href}>{label}</Link>
            </Button>
          );
        })}
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 text-[12.5px] text-foreground hover:opacity-80 transition-opacity">
            <span>{user?.username ?? '…'}</span>
            <div className="w-8 h-8 rounded-full bg-secondary border border-border grid place-items-center text-muted-foreground">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19c1.2-3 4-4.2 7-4.2s5.8 1.2 7 4.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">
            {user?.email ?? ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            asChild
            className="text-[12.5px] cursor-pointer"
          >
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          {user?.role === 'admin' && (
            <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
              <Link href="/admin/dashboard">Admin</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-[12.5px] text-destructive focus:text-destructive cursor-pointer"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}