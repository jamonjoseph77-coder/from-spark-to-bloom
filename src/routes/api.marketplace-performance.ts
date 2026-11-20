import { createFileRoute } from "@tanstack/react-router";

type ProgressRow = {
  user_id: string;
  title_id: string;
  position_seconds: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
};

type TitleRow = {
  id: string;
  title: string;
  type: string;
  genre: string;
  publisher: string;
  release_year: number | null;
};

export const Route = createFileRoute("/api/marketplace-performance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env["CINEMA_MARKETPLACE_ANALYTICS_TOKEN"];
        if (!token) {
          return Response.json({ error: "Performance export is not configured." }, { status: 503 });
        }

        const authorization = request.headers.get("authorization") ?? "";
        if (authorization !== `Bearer ${token}`) {
          return Response.json({ error: "Unauthorised." }, { status: 401 });
        }

        const url = new URL(request.url);
        const requestedDays = Number(url.searchParams.get("days") ?? "30");
        const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(1, Math.floor(requestedDays))) : 30;
        const periodEnd = new Date();
        const periodStart = new Date(periodEnd.getTime() - days * 86_400_000);

        try {
          // Load the service-role client only inside the server handler. Never bundle it for the browser.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: progressRows, error: progressError } = await supabaseAdmin
            .from("watch_progress")
            .select("user_id,title_id,position_seconds,duration_seconds,completed,updated_at")
            .gte("updated_at", periodStart.toISOString())
            .lte("updated_at", periodEnd.toISOString())
            .order("updated_at", { ascending: false })
            .limit(20000);

          if (progressError) throw progressError;
          const rows = (progressRows ?? []) as ProgressRow[];
          const titleIds = Array.from(new Set(rows.map((row) => row.title_id).filter(Boolean)));
          if (!titleIds.length) {
            return Response.json({
              source: "Cinema watch_progress",
              metricType: "progress_state_not_playback_events",
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
              generatedAt: new Date().toISOString(),
              dataQuality: "verified_progress_records_no_title_activity",
              titles: [],
              limitations: ["No playback-start, heartbeat, cumulative watch-time, repeat-view, country or placement-render events are currently stored."],
            }, { headers: { "Cache-Control": "private, no-store" } });
          }

          const { data: titleRows, error: titleError } = await supabaseAdmin
            .from("titles")
            .select("id,title,type,genre,publisher,release_year")
            .eq("is_published", true)
            .in("id", titleIds);

          if (titleError) throw titleError;
          const titleById = new Map(((titleRows ?? []) as TitleRow[]).map((title) => [title.id, title]));
          const grouped = new Map<string, ProgressRow[]>();
          for (const row of rows) {
            if (!titleById.has(row.title_id)) continue;
            const group = grouped.get(row.title_id) ?? [];
            group.push(row);
            grouped.set(row.title_id, group);
          }

          const titles = Array.from(grouped.entries()).flatMap(([titleId, entries]) => {
            const uniqueViewers = new Set(entries.map((entry) => entry.user_id).filter(Boolean)).size;
            // Suppress small cohorts; do not expose individual viewer data.
            if (uniqueViewers < 5) return [];
            const completedRecords = entries.filter((entry) => entry.completed).length;
            const progressRatios = entries
              .filter((entry) => entry.duration_seconds > 0)
              .map((entry) => Math.min(1, Math.max(0, entry.position_seconds / entry.duration_seconds)));
            const title = titleById.get(titleId)!;
            return [{
              titleId,
              title: title.title,
              contentType: title.type,
              genres: title.genre.split(",").map((value) => value.trim()).filter(Boolean),
              publisher: title.publisher,
              releaseYear: title.release_year,
              uniqueEngagedAccounts: uniqueViewers,
              progressRecords: entries.length,
              completedProgressRecords: completedRecords,
              completionStateShare: entries.length ? completedRecords / entries.length : null,
              averageLatestPositionPercent: progressRatios.length
                ? progressRatios.reduce((sum, value) => sum + value, 0) / progressRatios.length * 100
                : null,
              metricCaveat: "These are saved progress states, not playback starts, verified views, cumulative watch time or unique people.",
            }];
          });

          return Response.json({
            source: "Cinema watch_progress",
            metricType: "progress_state_not_playback_events",
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            generatedAt: new Date().toISOString(),
            dataQuality: "aggregate_progress_only",
            titles,
            limitations: [
              "Saved progress records are not playback-start or impression counts.",
              "Position is the latest saved position, not cumulative watch time.",
              "Repeat viewing is not measured.",
              "Country/region attribution is not available in this source.",
              "Commercial placement impressions and clicks require explicit placement events.",
              "Viewer cohorts smaller than five accounts are suppressed.",
            ],
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          console.error("[Marketplace performance export]", error);
          return Response.json({ error: "The aggregate performance export could not be completed." }, { status: 500 });
        }
      },
    },
  },
});
