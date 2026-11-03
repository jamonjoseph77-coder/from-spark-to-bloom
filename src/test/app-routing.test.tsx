import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("registers a renderable component for every generated top-level route", () => {
    const routes = Object.entries(routeTree.children ?? {});

    expect(routes.length).toBeGreaterThan(0);

    const invalidRoutes = routes
      .filter(([, route]) => typeof route.options.component !== "function")
      .map(([name]) => name);

    expect(invalidRoutes, `Routes without a component: ${invalidRoutes.join(", ")}`).toEqual([]);
  });

  it("matches the sign-in and password-recovery pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    for (const path of ["/sign-in", "/forgot-password", "/reset-password"]) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId, `No route matched ${path}`).not.toBe(rootRouteId);
    }
  });
});
