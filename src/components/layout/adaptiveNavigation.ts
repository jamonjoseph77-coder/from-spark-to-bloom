import type { Route } from '@/lib/router';

export interface AdaptiveDestination {
  href: string;
  label: string;
}

const STORAGE_KEY = 'cinema.adaptive-navigation.v1';
const DEFAULT_DESTINATION: AdaptiveDestination = { href: '/', label: 'Home' };
const DESTINATIONS: Record<string, AdaptiveDestination> = {
  home: DEFAULT_DESTINATION,
  discover: { href: '/discover', label: 'Explore' },
  shorts: { href: '/shorts', label: 'Shorts' },
  movies: { href: '/movies', label: 'Movies' },
  series: { href: '/series', label: 'Series' },
  sports: { href: '/sports', label: 'Sports' },
  live: { href: '/live-tv', label: 'Live TV' },
  'my-cinema': { href: '/my-cinema', label: 'My Cinema' },
  friends: { href: '/friends', label: 'Friends' },
};

type VisitStore = Record<string, number[]>;

function destinationKey(route: Route): string | null {
  if (route.name === 'home') return 'home';
  if (route.name === 'discover') return 'discover';
  if (route.name === 'shorts') return 'shorts';
  if (route.name === 'my-cinema') return 'my-cinema';
  if (route.name === 'friends') return 'friends';
  if (route.name === 'browse') {
    if (route.kind === 'movie') return 'movies';
    if (route.kind === 'series') return 'series';
    if (route.kind === 'sport') return 'sports';
    if (route.kind === 'live') return 'live';
  }
  return null;
}

function readVisits(): VisitStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as VisitStore;
  } catch {
    return {};
  }
}

function preferredFrom(store: VisitStore): AdaptiveDestination {
  const now = Date.now();
  const halfLifeMs = 14 * 24 * 60 * 60 * 1000;
  let winner = DEFAULT_DESTINATION;
  let winningScore = 0;

  for (const [key, timestamps] of Object.entries(store)) {
    const destination = DESTINATIONS[key];
    if (!destination || !Array.isArray(timestamps)) continue;
    const score = timestamps.reduce((total, timestamp) => {
      if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return total;
      const age = Math.max(0, now - timestamp);
      if (age > 90 * 24 * 60 * 60 * 1000) return total;
      return total + Math.pow(0.5, age / halfLifeMs);
    }, 0);
    if (score > winningScore) {
      winningScore = score;
      winner = destination;
    }
  }
  return winner;
}

export function getAdaptiveDestination(): AdaptiveDestination {
  return preferredFrom(readVisits());
}

export function recordAdaptiveVisit(route: Route): AdaptiveDestination {
  const key = destinationKey(route);
  if (!key || typeof window === 'undefined') return getAdaptiveDestination();

  const now = Date.now();
  const store = readVisits();
  const recent = Array.isArray(store[key]) ? store[key] : [];
  store[key] = [...recent.filter((timestamp) => typeof timestamp === 'number' && now - timestamp < 90 * 24 * 60 * 60 * 1000), now].slice(-80);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // The adaptive shortcut still works with the current in-memory visit.
  }
  return preferredFrom(store);
}
