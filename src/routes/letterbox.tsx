import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/letterbox')({
  beforeLoad: () => { throw redirect({ to: '/friends' }); },
});
