import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

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

export function ProfileAvatar({ name, size = 'md', imageUrl, previewable = true }: { name: string; size?: keyof typeof SIZES; imageUrl?: string | null; previewable?: boolean }) {
  const source = safeAvatarSource(imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => setImageFailed(false), [source]);
  const label = name.trim() || 'Cinema member';

  return (
    <>
    <span
      role={source && !imageFailed ? undefined : "img"}
      aria-label={source && !imageFailed ? undefined : `${label}'s profile initials`}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-cinema-500 to-cinema-800 font-extrabold uppercase text-white shadow-lg shadow-black/20 ring-2 ring-white/5 ${SIZES[size]}`}
    >
      {source && !imageFailed ? (
        previewable ? <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPreviewOpen(true); }} aria-haspopup="dialog" aria-label={`View ${label}'s profile picture`} className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <img src={source} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        </button> : <img src={source} alt={`${label}'s profile picture`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{label.charAt(0) || '?'}</span>
      )}
    </span>
    {source && !imageFailed && previewOpen && <Modal label={`${label}'s profile picture`} onClose={() => setPreviewOpen(false)} compact>
      <img src={source} alt={`${label}'s profile picture`} className="mx-auto max-h-[42dvh] max-w-full rounded-xl object-contain" />
      <p className="mt-3 text-center text-sm font-semibold text-white">{label}</p>
    </Modal>}
    </>
  );
}
