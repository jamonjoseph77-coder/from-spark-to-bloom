import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { registerRouter } from "./lib/router";

// A deployment can replace hashed route chunks while a visitor still has an
// older app shell open. Recover once with a cache-busting navigation instead
// of leaving the visitor on a blank screen after Vite's preload error.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    const recoveryParam = "_cinema_chunk_recovery";
    const currentUrl = new URL(window.location.href);

    if (currentUrl.searchParams.has(recoveryParam)) {
      console.error("Cinema could not load a route chunk after a recovery reload.");
      document.body.innerHTML = `
        <main style="min-height:100vh;display:grid;place-items:center;background:#03070d;color:#fff;padding:24px;font-family:system-ui,sans-serif;text-align:center">
          <div>
            <h1 style="font-size:24px;margin-bottom:8px">Cinema is having trouble loading</h1>
            <p style="color:#b8c2d1;margin-bottom:20px">The latest page files could not be reached. Please try opening Cinema again.</p>
            <a href="/" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#1677ff;color:#fff;text-decoration:none">Reload Cinema</a>
          </div>
        </main>
      `;
      return;
    }

    currentUrl.searchParams.set(recoveryParam, String(Date.now()));
    window.location.replace(currentUrl.toString());
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  registerRouter(router);
  return router;
};
