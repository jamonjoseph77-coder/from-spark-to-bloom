const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-20 w-20 text-3xl',
} as const;

function safeAvatarSource(value?: string | null): string | null {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  if (/^data:image\/(?:webp|png|jpeg);base64,/i.test(value)) return value;
  return null;
}

export function ProfileAvatar({ name, size = 'md', imageUrl }: { name: string; size?: keyof typeof SIZES; imageUrl?: string | null }) {
  const source = safeAvatarSource(imageUrl);
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cinema-500 to-cinema-800 font-extrabold uppercase text-white ring-1 ring-white/15 ${SIZES[size]}`}
    >
      {source ? <img src={source} alt="" loading="lazy" className="h-full w-full object-cover" /> : (name.trim().charAt(0) || '?')}
    </span>
  );
}
