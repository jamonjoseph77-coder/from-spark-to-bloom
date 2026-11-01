import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

export const Route = createFileRoute('/reset-password')({
  head: () => ({
    meta: [
      { title: 'Choose a new password — Cinema' },
      { name: 'description', content: 'Set a new Cinema password.' },
      { property: 'og:title', content: 'Choose a new password — Cinema' },
      { property: 'og:description', content: 'Set a new Cinema password.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <ResetPasswordPage />;
}
