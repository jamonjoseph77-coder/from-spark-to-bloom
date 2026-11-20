import type { ReactNode } from 'react';
import { SideNav } from '@/components/layout/SideNav';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import { AnalyticsConsent } from '@/components/layout/AnalyticsConsent';
import { AdvertisingConsent } from '@/components/layout/AdvertisingConsent';
import type { Route } from '@/lib/router';
import './cinema-premium-polish.css';

interface AppShellProps { route: Route; children: ReactNode }

export function AppShell({ route, children }: AppShellProps) {
  return (
    <div className="cinema-app-shell min-h-screen text-slate-100">
      <SideNav route={route} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-12">{children}</main>
        <footer className="border-t border-white/5 px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center">
            <CinemaLogo compact />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p>Experience the World of Stories.</p>
              <a href="/about" className="font-semibold text-slate-400 transition hover:text-white">About & Credits</a>
              <a href="https://cinema-presence-marketplace.lovable.app" target="_blank" rel="noreferrer"
                className="font-semibold text-cinema-300 transition hover:text-white">Partner With Cinema</a>
            </div>
          </div>
        </footer>
      </div>
      <MobileNav route={route} />
      <AnalyticsConsent />
      <AdvertisingConsent />
    </div>
  );
}
