import { useEffect, useState } from 'react';

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-3xl',
} as const;

function safeAvatarSource(value?: string | null): string | null {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  if (/^data:image\/(?:webp|png|jpeg);base64,/i.test(value)) return value;
  return null;
}

export function ProfileAvatar({ name, size = 'md', imageUrl }: { name: string; size?: keyof typeof SIZES; imageUrl?: string | null }) {
  const source = safeAvatarSource(imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [source]);
  const label = name.trim() || 'Cinema member';

  return (
    <span
      role="img"
      aria-label={source && !imageFailed ? `${label}'s profile picture` : `${label}'s profile initials`}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-cinema-500 to-cinema-800 font-extrabold uppercase text-white shadow-lg shadow-black/20 ring-2 ring-white/5 ${SIZES[size]}`}
    >
      {source && !imageFailed ? (
        <img
          src={source}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{label.charAt(0) || '?'}</span>
      )}
    </span>
  );
}
