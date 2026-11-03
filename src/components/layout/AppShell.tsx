import type { ReactNode } from 'react';
import { SideNav } from '@/components/layout/SideNav';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import type { Route } from '@/lib/router';

interface AppShellProps { route: Route; children: ReactNode }

export function AppShell({ route, children }: AppShellProps) {
  return (
    <div className="min-h-screen text-slate-100">
      <SideNav route={route} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-12">{children}</main>
        <footer className="hidden border-t border-white/5 px-10 py-6 lg:block">
          <div className="flex items-center justify-between gap-6 text-xs text-slate-500">
            <CinemaLogo compact />
            <p>Experience the World of Stories.</p>
          </div>
        </footer>
      </div>
      <MobileNav route={route} />
    </div>
  );
}
