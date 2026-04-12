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
import { getAvatarColor } from '@/lib/avatar';

interface NavBarProps {
  mode?: 'default' | 'admin';
  activePage?: 'dashboard' | 'matching' | 'questions' | 'admin-dashboard' | 'admin-questions';
  sidebarOffset?: number;
}

const PeerPrepLogo = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-[26px] h-[26px] text-foreground">
    <path d="M4 8L12 16L4 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14.5" y1="22" x2="17.5" y2="10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 8L20 16L28 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function LetterAvatar({ username }: { username: string }) {
  const letter = (username[0] ?? '?').toUpperCase();
  const bg = getAvatarColor(username);

  return (
    <div
      className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-semibold text-white shrink-0 transition-transform duration-200 hover:scale-105"
      style={{ backgroundColor: bg }}
    >
      {letter}
    </div>
  );
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
  { href: '/matching', label: 'Matching', key: 'matching' },
  { href: '/questions', label: 'Questions', key: 'questions' },
] as const;

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', key: 'admin-dashboard' },
  { href: '/admin/questions', label: 'Questions', key: 'admin-questions' },
] as const;

export function NavBar({ mode = 'default', activePage, sidebarOffset = 0 }: NavBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAdminMode = mode === 'admin';
  const links = isAdminMode ? adminNavLinks : navLinks;
  const homeHref = isAdminMode ? '/admin/dashboard' : '/dashboard';
  const brandLabel = isAdminMode ? 'PeerPrep Admin' : 'PeerPrep';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navStyle: React.CSSProperties = sidebarOffset > 0
    ? {
        left: `calc(50% + ${sidebarOffset / 2}px)`,
        width: `calc(100% - ${sidebarOffset}px - 2rem)`,
        maxWidth: `min(1100px, calc(100% - ${sidebarOffset}px - 2rem))`,
        transition: 'left 300ms ease-out, width 300ms ease-out, max-width 300ms ease-out',
      }
    : {
        transition: 'left 300ms ease-out, width 300ms ease-out, max-width 300ms ease-out',
      };

  return (
    <nav
      className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[1100px]
        grid grid-cols-3 items-center px-5 py-2
        rounded-2xl
        bg-white/40 backdrop-blur-2xl backdrop-saturate-150
        border border-white/50
        shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)]
        animate-nav-slide-down"
      style={navStyle}
    >
      <Link
        href={homeHref}
        className="flex items-center gap-2.5 font-semibold text-foreground no-underline group"
      >
        <span className="transition-transform duration-200 group-hover:scale-110">
          <PeerPrepLogo />
        </span>
        <span style={{ fontFamily: 'var(--font-serif)' }}>{brandLabel}</span>
      </Link>

      <div className="flex justify-center gap-1">
        {links.map(({ href, label, key }) => {
          const isActive = activePage === key;
          return (
            <Button
              key={key}
              asChild
              variant="ghost"
              size="sm"
              className={`rounded-xl text-[12.5px] transition-all duration-200 hover:shadow-none ${isActive
                ? 'bg-white/70 text-foreground font-semibold shadow-sm backdrop-blur-sm hover:bg-white/70 hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/40 bg-transparent'
                }`}
            >
              <Link href={href}>{label}</Link>
            </Button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-[12.5px] text-foreground transition-opacity duration-200 hover:opacity-80 min-w-0 cursor-pointer outline-none focus:outline-none focus-visible:ring-0">
              {user?.role === 'admin' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d6c7f7] text-[#4c2fbf] font-semibold whitespace-nowrap">
                  ADMIN
                </span>
              )}
              <span className="text-[12.5px] font-medium text-foreground truncate max-w-[120px]">
                {user?.username ?? '…'}
              </span>

              <LetterAvatar username={user?.username ?? '?'} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">
              {user?.email ?? ''}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdminMode && (
              <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
                <Link href="/dashboard">User View</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            {!isAdminMode && (
              <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
                <Link href="/faq">FAQ</Link>
              </DropdownMenuItem>
            )}
            {!isAdminMode && user?.role === 'admin' && (
              <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
                <Link href="/admin/dashboard">Admin</Link>
              </DropdownMenuItem>
            )}
            {!isAdminMode && user?.role === 'admin' && (
              <DropdownMenuItem asChild className="text-[12.5px] cursor-pointer">
                <Link href="/admin/questions">Add Questions</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[12.5px] text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
