import { createFileRoute } from '@tanstack/react-router';
import { LetterboxPage } from '@/pages/LetterboxPage';

export const Route = createFileRoute('/letterbox')({
  head: () => ({ meta: [{ title: 'Letterbox — Cinema' }, { name: 'description', content: 'Entertainment conversations and recommendations.' }] }),
  component: LetterboxPage,
});
