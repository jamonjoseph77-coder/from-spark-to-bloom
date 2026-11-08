import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  addUserTitle,
  fetchUserTitleIds,
  fetchWatchProgress,
  removeUserTitle,
  upsertWatchProgress,
} from '@/lib/library';
import type { ProgressEntry, UserListTable, WatchProgress } from '@/lib/types';

export interface LibraryContextValue {
  watchlistIds: ReadonlySet<string>;
  favouriteIds: ReadonlySet<string>;
  progress: WatchProgress[];
  ready: boolean;
  toggleWatchlist: (titleId: string) => Promise<void>;
  toggleFavourite: (titleId: string) => Promise<void>;
  saveProgress: (entry: ProgressEntry) => Promise<void>;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);

function withMember(ids: ReadonlySet<string>, id: string, present: boolean): Set<string> {
  const next = new Set(ids);
  if (present) next.add(id);
  else next.delete(id);
  return next;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const userId = user?.id ?? null;

  const [watchlistIds, setWatchlistIds] = useState<ReadonlySet<string>>(new Set());
  const [favouriteIds, setFavouriteIds] = useState<ReadonlySet<string>>(new Set());
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [ready, setReady] = useState(false);
  const watchlistRef = useRef<ReadonlySet<string>>(new Set());
  const favouritesRef = useRef<ReadonlySet<string>>(new Set());
  const pendingMembershipsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) {
      watchlistRef.current = new Set();
      favouritesRef.current = new Set();
      pendingMembershipsRef.current.clear();
      setWatchlistIds(new Set());
      setFavouriteIds(new Set());
      setProgress([]);
      setReady(true);
      return;
    }
    let active = true;
    // Clear the previous account's private library immediately on account changes.
    watchlistRef.current = new Set();
    favouritesRef.current = new Set();
    pendingMembershipsRef.current.clear();
    setWatchlistIds(new Set());
    setFavouriteIds(new Set());
    setProgress([]);
    setReady(false);
    Promise.all([
      fetchUserTitleIds('watchlist_items', userId),
      fetchUserTitleIds('favourites', userId),
      fetchWatchProgress(userId),
    ])
      .then(([watchlist, favourites, history]) => {
        if (!active) return;
        const nextWatchlist = new Set(watchlist);
        const nextFavourites = new Set(favourites);
        watchlistRef.current = nextWatchlist;
        favouritesRef.current = nextFavourites;
        setWatchlistIds(nextWatchlist);
        setFavouriteIds(nextFavourites);
        setProgress(history);
      })
      .catch(() => {
        if (active) notify('We could not load your saved titles. Refresh the page to try again.', 'error');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [userId, notify]);

  const toggleMembership = useCallback(
    async (
      table: UserListTable,
      idsRef: { current: ReadonlySet<string> },
      setIds: (next: ReadonlySet<string>) => void,
      titleId: string,
    ) => {
      if (!userId) return;
      const pendingKey = `${table}:${titleId}`;
      if (pendingMembershipsRef.current.has(pendingKey)) return;

      const current = idsRef.current;
      const wasMember = current.has(titleId);
      const next = withMember(current, titleId, !wasMember);
      pendingMembershipsRef.current.add(pendingKey);
      idsRef.current = next;
      setIds(next);

      try {
        if (wasMember) await removeUserTitle(table, userId, titleId);
        else await addUserTitle(table, userId, titleId);
      } catch {
        const rolledBack = withMember(idsRef.current, titleId, wasMember);
        idsRef.current = rolledBack;
        setIds(rolledBack);
        notify('That change did not save. Please try again.', 'error');
      } finally {
        pendingMembershipsRef.current.delete(pendingKey);
      }
    },
    [userId, notify],
  );

  const toggleWatchlist = useCallback(
    (titleId: string) => toggleMembership('watchlist_items', watchlistRef, setWatchlistIds, titleId),
    [toggleMembership],
  );

  const toggleFavourite = useCallback(
    (titleId: string) => toggleMembership('favourites', favouritesRef, setFavouriteIds, titleId),
    [toggleMembership],
  );

  const saveProgress = useCallback(
    async (entry: ProgressEntry) => {
      if (!userId) return;
      try {
        const saved = await upsertWatchProgress(userId, entry);
        setProgress((previous) => [saved, ...previous.filter((item) => item.content_id !== saved.content_id)]);
      } catch (error) {
        console.warn('Watch progress could not be saved', error);
      }
    },
    [userId],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({ watchlistIds, favouriteIds, progress, ready, toggleWatchlist, toggleFavourite, saveProgress }),
    [watchlistIds, favouriteIds, progress, ready, toggleWatchlist, toggleFavourite, saveProgress],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
