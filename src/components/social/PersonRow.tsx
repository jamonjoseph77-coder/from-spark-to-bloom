import type { ReactNode } from 'react';
import type { Profile } from '@/lib/types';
import { ProfileAvatar } from '@/components/social/ProfileAvatar';

export function PersonRow({ profile, children }: { profile: Profile | null; children?: ReactNode }) {
  const name = profile?.display_name ?? 'Cinema member';
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-[#91b7a2]/12 bg-[linear-gradient(125deg,#202a24,#171f1b_72%,#151b18)] p-4 shadow-[0_10px_30px_rgba(0,0,0,.12)] transition hover:border-[#91b7a2]/30 hover:shadow-[0_14px_34px_rgba(0,0,0,.18)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <ProfileAvatar name={name} imageUrl={profile?.avatar_url} />
        <div className="min-w-0">
          {profile ? <a href={`/profile?username=${encodeURIComponent(profile.username)}`} className="block truncate font-semibold text-white transition hover:text-sky-200">{name}</a> : <p className="truncate font-semibold text-white">{name}</p>}
          {profile && <a href={`/profile?username=${encodeURIComponent(profile.username)}`} className="block truncate text-sm text-slate-400 hover:text-sky-200">@{profile.username}</a>}
          {profile?.bio && <p className="mt-1 line-clamp-1 text-sm text-slate-300">{profile.bio}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </li>
  );
}
