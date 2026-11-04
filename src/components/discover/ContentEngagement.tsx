import { useEffect, useState, type FormEvent } from 'react';
import { Heart, Star, Share2, Send, Users, Copy, Check, LoaderCircle, BookmarkPlus, BookmarkCheck, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { loadFriendsSnapshot, type FriendEntry } from '@/lib/friends';
import { addDiscoverContentComment, fetchDiscoverContentEngagement, shareDiscoverContent, toggleDiscoverContentLike, type DiscoverContentComment } from '@/lib/discoverEngagement';
import { fetchSavedDiscoverClipIds, setDiscoverClipSaved } from '@/lib/clips';
import { navigateTo } from '@/lib/router';

interface ContentEngagementProps {
  contentKey: string;
  title: string;
  href: string;
  imageUrl?: string;
  compact?: boolean;
  shareOnly?: boolean;
  reviewOnly?: boolean;
  clipId?: string;
  viewsCount?: number;
}

export function ContentEngagement({ contentKey, title, href, imageUrl = '', compact = false, shareOnly = false, reviewOnly = false, clipId, viewsCount = 0 }: ContentEngagementProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviews, setReviews] = useState<DiscoverContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [savingLike, setSavingLike] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingClip, setSavingClip] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const result = await fetchDiscoverContentEngagement(contentKey);
      setLikeCount(result.reactions.length);
      setLiked(Boolean(user?.id && result.reactions.some((reaction) => reaction.user_id === user.id)));
      setReviews(result.comments);
    } catch (error) {
      console.warn('Explore content reviews could not be loaded', error);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDiscoverContentEngagement(contentKey).then((result) => {
      if (!active) return;
      setLikeCount(result.reactions.length);
      setLiked(Boolean(user?.id && result.reactions.some((reaction) => reaction.user_id === user.id)));
      setReviews(result.comments);
    }).catch((error) => console.warn('Explore content engagement could not be loaded', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contentKey, user?.id]);

  useEffect(() => {
    let active = true;
    if (!user?.id || !clipId) { setSaved(false); return () => { active = false; }; }
    fetchSavedDiscoverClipIds(user.id).then((ids) => { if (active) setSaved(ids.includes(clipId)); })
      .catch((error) => console.warn('Saved Cinema Shorts Could Not Be Loaded', error));
    return () => { active = false; };
  }, [clipId, user?.id]);

  async function toggleLike() {
    if (!user) { notify('Sign In To Like This Content.'); navigateTo('/sign-in'); return; }
    if (savingLike) return;
    const previous = liked;
    setLiked(!previous);
    setLikeCount((count) => Math.max(0, count + (previous ? -1 : 1)));
    setSavingLike(true);
    try { await toggleDiscoverContentLike(contentKey, user.id, previous); }
    catch { setLiked(previous); setLikeCount((count) => Math.max(0, count + (previous ? 1 : -1))); notify('Your Like Could Not Be Saved. Please Try Again.', 'error'); }
    finally { setSavingLike(false); }
  }

  async function toggleSave() {
    if (!clipId) return;
    if (!user) { notify('Sign In To Save This Short To My Cinema.'); navigateTo('/sign-in'); return; }
    if (savingClip) return;
    const next = !saved;
    setSaved(next);
    setSavingClip(true);
    try {
      await setDiscoverClipSaved(clipId, user.id, next);
      notify(next ? 'Short Saved To My Cinema.' : 'Short Removed From My Cinema.');
    } catch (error) {
      setSaved(!next);
      console.warn('Cinema Short Save Could Not Be Updated', error);
      notify('This Short Could Not Be Saved. Please Try Again.', 'error');
    } finally { setSavingClip(false); }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { notify('Sign In To Write A Review.'); navigateTo('/sign-in'); return; }
    const body = reviewText.trim();
    if (!body || savingReview) return;
    setSavingReview(true);
    try {
      await addDiscoverContentComment(contentKey, user.id, body);
      setReviewText('');
      await refresh();
      notify('Your Review Has Been Added.');
    } catch {
      notify('Your Review Could Not Be Added. Please Try Again.', 'error');
    } finally { setSavingReview(false); }
  }

  async function openShare() {
    if (!user) { notify('Sign In To Share With Friends.'); navigateTo('/sign-in'); return; }
    setShareOpen(true);
    setFriendsLoading(true);
    try { const snapshot = await loadFriendsSnapshot(user.id); setFriends(snapshot.friends); }
    catch { notify('Your Friends Could Not Be Loaded. Please Try Again.', 'error'); }
    finally { setFriendsLoading(false); }
  }

  async function sendToFriend() {
    if (!user || !selectedFriend || sharing) return;
    setSharing(true);
    try {
      await shareDiscoverContent({ contentKey, title, url: href, imageUrl, senderId: user.id, recipientId: selectedFriend, message: shareMessage });
      notify('Content Shared With Your Friend.');
      setShareOpen(false); setSelectedFriend(''); setShareMessage('');
    } catch { notify('This Content Could Not Be Shared. Check Your Friendship And Try Again.', 'error'); }
    finally { setSharing(false); }
  }

  async function shareOutsideCinema() {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, text: 'Discover This On Cinema.', url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Cinema Link Copied.'); }
      else notify('Sharing Is Not Available On This Browser.', 'error');
    } catch (error) { if (error instanceof Error && error.name !== 'AbortError') notify('Could Not Share This Content.', 'error'); }
  }

  return (
    <>
      {shareOnly ? (
        <>
          {clipId && <div aria-label={`${viewsCount.toLocaleString()} views`} className="cinema-social-action flex min-w-[52px] flex-col items-center justify-center gap-1 p-2 text-white"><Eye className="h-5 w-5 text-slate-100" /><span className="text-[10px] font-bold tabular-nums">{viewsCount.toLocaleString()}</span><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Views</span></div>}
          <button type="button" onClick={() => void openShare()} aria-label={`Share ${title} with friends`} className="cinema-social-action flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-slate-300">
            <Share2 className="h-4 w-4" /><span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Share</span>
          </button>
          {clipId && <button type="button" onClick={() => void toggleSave()} disabled={savingClip} aria-pressed={saved} aria-label={saved ? `Remove ${title} from saved shorts` : `Save ${title} to My Cinema`} className="cinema-social-action flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-slate-300 disabled:opacity-60">
            {saved ? <BookmarkCheck className="h-4 w-4 text-slate-200" /> : <BookmarkPlus className="h-4 w-4" />}
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">{saved ? 'Saved' : 'Save'}</span>
          </button>}
        </>
      ) : reviewOnly ? (
        <div className="cinema-content-engagement mt-2 flex items-center gap-1 p-1.5">
          <button type="button" onClick={() => setReviewOpen(true)} className="cinema-trailer-action !rounded-full !border !border-white/10 !bg-white/[.025] !px-2 !py-1 !text-[10px] !text-slate-300 hover:!bg-white/[.06]" aria-label={`Write a review for ${title}`}>
            <Star className="h-3.5 w-3.5" /> Review <span className="tabular-nums">{loading ? '…' : reviews.length}</span>
          </button>
        </div>
      ) : (
        <div className={`cinema-content-engagement flex flex-wrap items-center gap-1 p-1 ${compact ? 'mt-1' : 'mt-1.5'}`}>
          {clipId && <span className="cinema-trailer-action !min-h-7 !rounded-full !border !border-white/10 !bg-white/[.035] !px-2 !py-1 !text-[10px] !text-slate-300" aria-label={`${viewsCount.toLocaleString()} views`}><Eye className="h-3.5 w-3.5" /> {viewsCount.toLocaleString()} Views</span>}
          <button type="button" onClick={() => void toggleLike()} disabled={savingLike} aria-pressed={liked} className="cinema-trailer-action !rounded-full !border !border-white/10 !bg-white/[.025] !px-2 !py-1 !text-[10px] !text-slate-300 hover:!bg-white/[.06]" aria-label={liked ? 'Unlike this content' : 'Like this content'}>
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current text-sky-200' : ''}`} /> Like <span className="tabular-nums">{loading ? '…' : likeCount}</span>
          </button>
          <button type="button" onClick={() => setReviewOpen(true)} className="cinema-trailer-action !rounded-full !border !border-white/10 !bg-white/[.025] !px-2 !py-1 !text-[10px] !text-slate-300 hover:!bg-white/[.06]" aria-label={`Write a review for ${title}`}>
            <Star className="h-3.5 w-3.5" /> Review <span className="tabular-nums">{loading ? '…' : reviews.length}</span>
          </button>
          <button type="button" onClick={() => void openShare()} className="cinema-trailer-action !rounded-full !border !border-white/10 !bg-white/[.025] !px-2 !py-1 !text-[10px] !text-slate-300 hover:!bg-white/[.06]" aria-label={`Share ${title} with friends`}>
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          {clipId && <button type="button" onClick={() => void toggleSave()} disabled={savingClip} aria-pressed={saved} className="cinema-trailer-action !rounded-full !border !border-white/10 !bg-white/[.025] !px-2 !py-1 !text-[10px] !text-slate-300 hover:!bg-white/[.06]" aria-label={saved ? 'Remove from saved shorts' : 'Save to My Cinema'}>
            {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-slate-200" /> : <BookmarkPlus className="h-3.5 w-3.5" />} {saved ? 'Saved' : 'Save'}
          </button>}
        </div>
      )}

      {reviewOpen && <Modal label={`Reviews For ${title}`} onClose={() => setReviewOpen(false)}>
        <div className="space-y-4 pt-2">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Cinema Reviews</p><h2 className="mt-1 pr-10 text-xl font-extrabold text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">Share Your View Of This Content With The Cinema Community.</p></div>
          <div className="max-h-[42dvh] space-y-3 overflow-y-auto pr-1">
            {loading && <p className="py-5 text-center text-xs text-slate-400">Loading Reviews…</p>}
            {!loading && reviews.length === 0 && <p className="rounded-xl border border-white/10 bg-white/[.03] p-5 text-center text-xs text-slate-400">No Reviews Yet. Be The First To Share One.</p>}
            {reviews.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><p className="text-xs font-bold text-sky-100">{review.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{review.body}</p><p className="mt-2 text-[10px] text-slate-500">{new Date(review.created_at).toLocaleString()}</p></article>)}
          </div>
          <form onSubmit={(event) => void submitReview(event)} className="flex gap-2 border-t border-white/10 pt-3">
            <input value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={1000} placeholder={user ? 'Write A Review…' : 'Sign In To Write A Review'} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" />
            <button type="submit" disabled={!reviewText.trim() || savingReview} aria-label="Post review" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-200 text-[#07101b] disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      </Modal>}

      {shareOpen && <Modal label={`Share ${title} With Friends`} onClose={() => setShareOpen(false)}>
        <div className="space-y-4 pt-2">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Send To Your Circle</p><h2 className="mt-1 pr-10 text-xl font-extrabold text-white">Share With Friends</h2><p className="mt-1 text-xs text-slate-400">Send This Cinema Pick Directly To A Friend.</p></div>
          <div className="max-h-[34dvh] space-y-2 overflow-y-auto pr-1">
            {friendsLoading && <p className="py-5 text-center text-xs text-slate-400"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> Finding Your Friends…</p>}
            {!friendsLoading && friends.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-center"><Users className="mx-auto h-6 w-6 text-sky-200" /><p className="mt-2 text-sm font-bold text-white">Your Circle Is Waiting</p><p className="mt-1 text-xs text-slate-400">Add Cinema Friends Before Sharing Content Directly.</p><a href="/friends" className="mt-3 inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white">Find Friends</a></div>}
            {friends.map((friend) => { const friendName = friend.profile?.display_name || friend.profile?.username || 'Cinema Friend'; return <button key={friend.otherUserId} type="button" onClick={() => setSelectedFriend(friend.otherUserId)} aria-pressed={selectedFriend === friend.otherUserId} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedFriend === friend.otherUserId ? 'border-sky-200/50 bg-sky-200/10' : 'border-white/10 bg-white/[.025] hover:bg-white/[.06]'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-slate-700 to-slate-950 text-sm font-black text-white">{friendName.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-white">{friendName}</span><span className="block text-[10px] text-slate-500">@{friend.profile?.username || 'cinema-friend'}</span></span>{selectedFriend === friend.otherUserId && <Check className="h-4 w-4 text-sky-200" />}</button>; })}
          </div>
          {friends.length > 0 && <><input value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} maxLength={300} placeholder="Add A Message (Optional)" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" /><button type="button" onClick={() => void sendToFriend()} disabled={!selectedFriend || sharing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-200 px-4 py-3 text-sm font-extrabold text-[#07101b] transition hover:bg-white disabled:opacity-40">{sharing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send To Friend</button></>}
          <button type="button" onClick={() => void shareOutsideCinema()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/[.04]"><Copy className="h-3.5 w-3.5" /> Copy Or Share Link Outside Cinema</button>
        </div>
      </Modal>}
    </>
  );
}
