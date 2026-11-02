import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/pages/HomePage';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: 'Cinema — Experience the World of Stories' },
      { name: 'description', content: 'Discover and experience movies, series, television, sports and entertainment with Cinema.' },
      { property: 'og:title', content: 'Cinema — Experience the World of Stories' },
      { property: 'og:description', content: 'Discover and experience movies, series, television, sports and entertainment with Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <HomePage />;
}
