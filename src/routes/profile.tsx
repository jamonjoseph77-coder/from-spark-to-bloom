import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/pages/ProfilePage';

export const Route = createFileRoute('/profile')({
  head: () => ({
    meta: [
      { title: 'Profile — Cinema' },
      { name: 'description', content: 'Edit your Cinema profile.' },
      { property: 'og:title', content: 'Profile — Cinema' },
      { property: 'og:description', content: 'Edit your Cinema profile.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <ProfilePage />;
}
