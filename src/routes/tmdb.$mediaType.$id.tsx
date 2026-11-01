import { createFileRoute, notFound } from '@tanstack/react-router';
import { TmdbDetailPage } from '@/pages/TmdbDetailPage';

export const Route = createFileRoute('/tmdb/$mediaType/$id')({
  beforeLoad: ({ params }) => {
    const id = Number(params.id);
    if ((params.mediaType !== 'movie' && params.mediaType !== 'tv') || !Number.isInteger(id) || id <= 0) throw notFound();
  },
  head: () => ({
    meta: [
      { title: 'Details — Cinema' },
      { name: 'description', content: 'Movie and series details.' },
      { property: 'og:title', content: 'Details — Cinema' },
      { property: 'og:description', content: 'Movie and series details.' },
    ],
  }),
  component: Page,
});

function Page() {
  const { mediaType, id } = Route.useParams();
  return <TmdbDetailPage mediaType={mediaType as 'movie' | 'tv'} id={Number(id)} />;
}
