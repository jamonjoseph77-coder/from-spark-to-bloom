import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/pages/AuthPage';

export const Route = createFileRoute('/forgot-password')({
  head: () => ({
    meta: [
      { title: 'Reset password — Cinema' },
      { name: 'description', content: 'Reset your Cinema password.' },
      { property: 'og:title', content: 'Reset password — Cinema' },
      { property: 'og:description', content: 'Reset your Cinema password.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <AuthPage mode="forgot-password" />;
}
