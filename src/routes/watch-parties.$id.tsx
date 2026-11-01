import { createFileRoute } from '@tanstack/react-router';
import { WatchPartyRoomPage } from '@/pages/WatchPartyRoomPage';

export const Route = createFileRoute('/watch-parties/$id')({
  head: () => ({
    meta: [
      { title: 'Watch Party — Cinema' },
      { name: 'description', content: 'Join the watch party.' },
      { property: 'og:title', content: 'Watch Party — Cinema' },
      { property: 'og:description', content: 'Join the watch party.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <WatchPartyRoomPage partyId={Route.useParams().id} />;
}
