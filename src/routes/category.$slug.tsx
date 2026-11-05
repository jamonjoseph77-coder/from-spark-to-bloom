import { createFileRoute } from '@tanstack/react-router';
import { CategoryDestinationPage } from '@/pages/CategoryDestinationPage';

export const Route = createFileRoute('/category/$slug')({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.charAt(0).toUpperCase() + params.slug.slice(1)} — Cinema` },
      { name: 'description', content: 'Explore a dedicated entertainment destination inside Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <CategoryDestinationPage slug={slug} />;
}
