import type { ReactNode } from 'react';
import type { Title } from '@/lib/types';
import { TitleCard } from '@/components/catalogue/TitleCard';
import { SECTION_HEADING } from '@/components/ui/styles';

interface TitleRowProps {
  heading: string;
  description?: string;
  titles: Title[];
  progressById?: ReadonlyMap<string, number>;
  action?: ReactNode;
  landscape?: boolean;
}

export function TitleRow({ heading, description, titles, progressById, action, landscape = false }: TitleRowProps) {
  if (titles.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={`${SECTION_HEADING} flex items-center gap-3`}>
            <span className="h-6 w-1 shrink-0 rounded-full bg-cinema-400" aria-hidden="true" />
            {heading}
          </h2>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="w-full min-w-0 max-w-full overflow-hidden"><div role="region" aria-label={`${heading} titles`} tabIndex={0} className="flex w-full min-w-0 max-w-full snap-x snap-mandatory touch-pan-x gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {titles.map((title) => (
          <div key={title.id} className={`${landscape ? 'w-64 sm:w-80 lg:w-96' : 'w-36 sm:w-44 lg:w-48'} flex-none snap-start`}>
            <TitleCard title={title} progress={progressById?.get(title.id)} landscape={landscape} />
          </div>
        ))}
      </div></div>
    </section>
  );
}
