import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AppShell } from "@/components/layout/AppShell";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { VisitorLandingPage } from "@/pages/VisitorLandingPage";
import { useAuth } from "@/hooks/useAuth";
import { CinemaLogo } from "@/components/ui/CinemaLogo";
import { useRoute } from "@/lib/router";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <CinemaFrame>
      <NotFoundPage />
    </CinemaFrame>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This Page Didn't Load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something Went Wrong. You Can Try Refreshing Or Return To Cinema.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#03070d" },
      { title: "Cinema — Experience the World of Stories" },
      { name: "description", content: "Discover And Experience Movies, Series, Television And Sports Through Cinema — A Connected Digital Entertainment Destination." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/cinema-icon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function CinemaShell({ children }: { children: ReactNode }) {
  const route = useRoute();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAccountRoute = route.name === "sign-in" || route.name === "sign-up" || route.name === "forgot-password" || route.name === "reset-password";

  // Keep plain <a href="/..."> links inside the app instead of reloading the page.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      event.preventDefault();
      void router.navigate({ href });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router]);

  // Visitors can see the branded entry and account flows, but the Cinema
  // experience itself is available only after a successful sign-in.
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07101b] px-6">
        <div className="flex flex-col items-center gap-5">
          <CinemaLogo compact />
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-sky-200/25 border-t-sky-200" />
          <p className="text-xs font-semibold tracking-wide text-slate-400">Preparing Your Cinema</p>
        </div>
      </main>
    );
  }

  if (!user && !isAccountRoute) return <VisitorLandingPage />;
  if (isAccountRoute) return <main className="min-h-screen bg-[#07101b]">{children}</main>;

  return <AppShell route={route}>{children}</AppShell>;
}

function CinemaFrame({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LibraryProvider>
          <CinemaShell>{children}</CinemaShell>
        </LibraryProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CinemaFrame>
        <Outlet />
      </CinemaFrame>
    </QueryClientProvider>
  );
}
