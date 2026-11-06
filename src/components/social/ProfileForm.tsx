import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';
import { useToast } from '@/hooks/useToast';
import { saveProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/types';
import { BUTTON_PRIMARY, CARD, INPUT, LABEL } from '@/components/ui/styles';

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

async function compressProfileImage(file: File): Promise<string> {
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('The selected image could not be opened.'));
      element.src = source;
    });
    const sizes = [256, 224, 192, 160];
    const qualities = [0.82, 0.74, 0.66, 0.58];
    let selected: Blob | null = null;
    for (const size of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image editing is not available in this browser.');
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (blob && (!selected || blob.size < selected.size)) selected = blob;
        if (blob && blob.size <= 120 * 1024) {
          selected = blob;
          break;
        }
      }
      if (selected && selected.size <= 120 * 1024) break;
    }
    if (!selected || selected.size > 120 * 1024) throw new Error('This image could not be reduced enough. Try another photo.');
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The image could not be saved.'));
      reader.onerror = () => reject(new Error('The image could not be saved.'));
      reader.readAsDataURL(selected as Blob);
    });
  } finally { URL.revokeObjectURL(source); }
}

interface ProfileFormProps {
  userId: string;
  profile: Profile | null;
  onSaved: () => void;
}

export function ProfileForm({ userId, profile, onSaved }: ProfileFormProps) {
  const { notify } = useToast();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [discoverable, setDiscoverable] = useState(profile?.is_discoverable ?? true);
  const [shareWatching, setShareWatching] = useState(profile?.share_watching_activity ?? false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP image smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try { setAvatarUrl(await compressProfileImage(file)); }
    catch (imageError) { setError(imageError instanceof Error ? imageError.message : 'Your profile picture could not be prepared.'); }
    finally { setAvatarBusy(false); event.target.value = ''; }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (avatarBusy) { setError('Wait for your profile picture to finish processing.'); return; }
    const cleanUsername = username.trim().toLowerCase();
    const cleanName = displayName.trim();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError('Usernames use 3 to 24 letters, numbers or underscores.');
      return;
    }
    if (cleanName.length < 1 || cleanName.length > 60) {
      setError('Enter a display name up to 60 characters long.');
      return;
    }
    if (bio.length > 280) {
      setError('Your bio can be up to 280 characters.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await saveProfile(
        userId,
        { avatar_url: avatarUrl || null, username: cleanUsername, display_name: cleanName, bio: bio.trim(), is_discoverable: discoverable, share_watching_activity: shareWatching },
        profile !== null,
      );
      notify(profile ? 'Profile saved.' : 'Welcome to Cinema. Your profile is ready.');
      onSaved();
    } catch (saveError) {
      const duplicate = (saveError as { code?: string }).code === '23505';
      setError(duplicate ? 'That username is already taken. Try another.' : 'Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${CARD} space-y-6`} noValidate>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/55 p-4">
        <ProfileAvatar name={displayName || username || 'Cinema'} imageUrl={avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <label htmlFor="profile-picture" className={LABEL}>Profile Picture</label>
          <input id="profile-picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleAvatarChange(event)} className={`${INPUT} mt-2`} disabled={avatarBusy} />
          <p className="mt-1 text-xs text-slate-500">JPG, PNG Or WebP · Up To 5 MB. Cinema Optimises Your Picture For Profiles.</p>
          {avatarBusy && <p className="mt-1 text-xs text-sky-200">Preparing Your Picture...</p>}
        </div>
        {avatarUrl && <button type="button" onClick={() => setAvatarUrl('')} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-300/30 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /> Remove</button>}
        {!avatarUrl && <span className="inline-flex items-center gap-2 text-xs text-slate-500"><ImagePlus className="h-4 w-4" /> Add A Photo</span>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-username" className={LABEL}>
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span>
            <input
              id="profile-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={24}
              autoComplete="off"
              className={`${INPUT} pl-8`}
              placeholder="yourname"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Friends find you by this name.</p>
        </div>
        <div>
          <label htmlFor="profile-display-name" className={LABEL}>
            Display name
          </label>
          <input
            id="profile-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={60}
            className={INPUT}
            placeholder="How you appear to others"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="profile-bio" className={LABEL}>
            Bio
          </label>
          <span className="text-xs text-slate-500">{bio.length}/280</span>
        </div>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={280}
          rows={3}
          className={`${INPUT} resize-none`}
          placeholder="Your favourite genres, or what you are watching"
        />
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-ink-900/60 p-4">
        <span>
          <span className="block text-sm font-semibold text-white">Let people find me</span>
          <span className="mt-1 block text-sm text-slate-400">
            When off, you will not appear in friend search. People you add or who add you can still see your profile.
          </span>
        </span>
        <span className="relative mt-1 inline-flex shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={discoverable}
            onChange={(event) => setDiscoverable(event.target.checked)}
          />
          <span className="h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-cinema-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cinema-400" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-ink-900/60 p-4">
        <span>
          <span className="block text-sm font-semibold text-white">Share What I’m Watching</span>
          <span className="mt-1 block text-sm text-slate-400">When enabled, accepted friends can see titles you are actively watching. This is off by default, and activity disappears from their Home after 20 minutes.</span>
        </span>
        <span className="relative mt-1 inline-flex shrink-0">
          <input type="checkbox" className="peer sr-only" checked={shareWatching} onChange={(event) => setShareWatching(event.target.checked)} />
          <span className="h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-cinema-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cinema-400" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving || avatarBusy} className={BUTTON_PRIMARY}>
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : profile ? 'Save changes' : 'Create profile'}
        </button>
      </div>
    </form>
  );
}
