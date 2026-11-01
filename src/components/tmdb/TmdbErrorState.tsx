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
        title="Movie and series information is not connected yet"
        description={
          isAdmin
            ? 'The movie and series information provider has not been configured for this environment. Ask the project administrator to check the server integration.'
            : 'Titles, posters and details will appear here once the information service is connected. Please check back soon.'
        }
        action={onRetry && <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>Try again</button>}
      />
    );
  }
  return <ErrorState onRetry={onRetry} />;
}
