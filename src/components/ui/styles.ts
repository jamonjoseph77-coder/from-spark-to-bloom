export const PAGE_CONTAINER = 'cinema-page-container mx-auto w-full max-w-[112rem] animate-rise-in px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-10';

export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-[#edf0ef] px-5 py-3 text-sm font-bold text-[#080b0a] shadow-[0_8px_24px_rgba(0,0,0,.22)] transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const BUTTON_ACCENT =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.07] px-5 py-3 text-sm font-bold text-slate-100 shadow-[0_8px_28px_rgba(0,0,0,.16)] backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[.12] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const BUTTON_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.035] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[.075] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const BUTTON_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50';

export const INPUT =
  'w-full rounded-2xl border border-white/12 bg-ink-850 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-sky-300/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20';

export const LABEL = 'mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400';

export const CARD = 'rounded-2xl border border-white/10 bg-ink-850/70 p-6 shadow-xl shadow-black/20';

export const SECTION_HEADING = 'text-xl font-extrabold tracking-tight text-white sm:text-2xl';

export const CHIP_BASE =
  'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none';

export function chipClass(active: boolean): string {
  return `${CHIP_BASE} ${
    active
      ? 'border-sky-300/35 bg-sky-400/15 text-white'
      : 'border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30 hover:text-white'
  }`;
}
