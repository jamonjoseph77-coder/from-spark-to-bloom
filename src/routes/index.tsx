import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/pages/HomePage';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Cinema — Experience the World of Stories' },
      { name: 'description', content: 'Stream movies, series, sports, news and live TV on Cinema.' },
      { property: 'og:title', content: 'Cinema — Experience the World of Stories' },
      { property: 'og:description', content: 'Stream movies, series, sports, news and live TV on Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <HomePage />;
}
