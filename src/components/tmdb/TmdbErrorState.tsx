import { useAuth } from '@/hooks/useAuth';
import { EmptyState, ErrorState } from '@/components/ui/StatusViews';
import { BUTTON_PRIMARY } from '@/components/ui/styles';
import { TmdbError } from '@/lib/tmdb';
import { Film } from 'lucide-react';

export function TmdbErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { isAdmin } = useAuth();
  if (error instanceof TmdbError && error.reason === 'not_configured') {
    return (
      <EmptyState
        icon={<Film className="h-7 w-7 text-cinema-300" />}
        title="Movie And Series Information Is Not Connected Yet"
        description={
          isAdmin
            ? 'The Movie And Series Information Provider Has Not Been Configured For This Environment. Ask The Project Administrator To Check The Server Integration.'
            : 'Titles, Posters And Details Will Appear Here Once The Information Service Is Connected. Please Check Back Soon.'
        }
        action={onRetry && <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>Try Again</button>}
      />
    );
  }
  return <ErrorState onRetry={onRetry} />;
}
