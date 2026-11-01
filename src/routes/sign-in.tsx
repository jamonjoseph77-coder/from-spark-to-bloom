import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/pages/AuthPage';

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      { title: 'Sign in — Cinema' },
      { name: 'description', content: 'Sign in to Cinema.' },
      { property: 'og:title', content: 'Sign in — Cinema' },
      { property: 'og:description', content: 'Sign in to Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <AuthPage mode="sign-in" />;
}
