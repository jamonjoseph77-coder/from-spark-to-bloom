import { ArrowLeft, Handshake, Clapperboard, ChartNoAxesCombined } from 'lucide-react';
import { PAGE_CONTAINER } from '@/components/ui/styles';
import type { ComingSoonSection } from '@/lib/router';

const CONTENT = {
  'box-office': {
    title: 'Digital Box Office',
    intro: 'A Title-Centred Commercial Framework For The Business Of Entertainment.',
    description: 'Cinema’s Digital Box Office Organises And Tracks Commercial Activity Associated With Eligible Films, Episodes, Programmes, Channels And Live Events. Each Eligible Content Property Can Have Its Own Commercial Record, While Platform-Wide Partnerships Are Accounted For Separately.',
    items: [
      { icon: Clapperboard, title: 'Content-Led Opportunities', body: 'Title Sponsorships, Approved Brand Partnerships, Premieres And Special Viewing Experiences, Subject To Rights-Holder Approval.' },
      { icon: Handshake, title: 'Partner Rights And Allocation', body: 'Clear Records For Contracted Deliverables, Rights-Holder Payments, Partner Allocations And Cinema’s Retained Revenue.' },
      { icon: ChartNoAxesCombined, title: 'Transparent Performance', body: 'A Consistent View Of Attributable Revenue, Direct Costs, Campaign Delivery And Title-Level Performance.' },
    ],
  },
} satisfies Record<ComingSoonSection, { title: string; intro: string; description: string; items: { icon: typeof Clapperboard; title: string; body: string }[] }>;

export function ComingSoonPage({ section }: { section: ComingSoonSection }) {
  const content = CONTENT[section];
  return (
    <div className={`${PAGE_CONTAINER} space-y-8`}>
      <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back To Cinema
      </a>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-cinema-400/15 bg-gradient-to-br from-cinema-700/25 via-ink-900 to-ink-950 p-7 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.2em] text-cinema-200">For Studios, Rights Holders And Brand Partners</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{content.title}</h1>
        <p className="mt-4 max-w-3xl text-lg font-semibold text-slate-200">{content.intro}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{content.description}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {content.items.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-ink-900/75 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cinema-500/15 text-cinema-200"><Icon className="h-5 w-5" /></span>
            <h2 className="mt-4 text-base font-extrabold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </article>
        ))}
      </section>
      <p className="text-xs leading-5 text-slate-500">All Commercial Activity Requires The Relevant Rights, Permissions, Contracts And Clear Revenue-Attribution Rules. The Digital Box Office Is A Commercial And Reporting Framework, Not A Viewer Rental Or Purchase Checkout.</p>
    </div>
  );
}
