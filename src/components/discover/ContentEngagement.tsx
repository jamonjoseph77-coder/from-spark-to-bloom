import { useEffect, useState, type FormEvent } from 'react';
import { Heart, MessageCircle, Share2, Send, Users, Copy, Check, LoaderCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { loadFriendsSnapshot, type FriendEntry } from '@/lib/friends';
import { addDiscoverContentComment, fetchDiscoverContentEngagement, shareDiscoverContent, toggleDiscoverContentLike, type DiscoverContentComment } from '@/lib/discoverEngagement';
import { navigateTo } from '@/lib/router';

interface ContentEngagementProps {
  contentKey: string;
  title: string;
  href: string;
  imageUrl?: string;
  compact?: boolean;
}

export function ContentEngagement({ contentKey, title, href, imageUrl = '', compact = false }: ContentEngagementProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<DiscoverContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [savingLike, setSavingLike] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const result = await fetchDiscoverContentEngagement(contentKey);
      setLikeCount(result.reactions.length);
      setLiked(Boolean(user?.id && result.reactions.some((reaction) => reaction.user_id === user.id)));
      setComments(result.comments);
    } catch (error) {
      console.warn('Explore content engagement could not be loaded', error);
    } finally { setLoading(false); }
  }

  useEffect(() => { let active = true; setLoading(true);
    fetchDiscoverContentEngagement(contentKey).then((result) => {
      if (!active) return;
      setLikeCount(result.reactions.length);
      setLiked(Boolean(user?.id && result.reactions.some((reaction) => reaction.user_id === user.id)));
      setComments(result.comments);
    }).catch((error) => console.warn('Explore content engagement could not be loaded', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contentKey, user?.id]);

  async function toggleLike() {
    if (!user) { notify('Create A Cinema Account To Like This Content.'); navigateTo('/sign-up'); return; }
    if (savingLike) return;
    const previous = liked;
    setLiked(!previous);
    setLikeCount((count) => Math.max(0, count + (previous ? -1 : 1)));
    setSavingLike(true);
    try { await toggleDiscoverContentLike(contentKey, user.id, previous); }
    catch { setLiked(previous); setLikeCount((count) => Math.max(0, count + (previous ? 1 : -1))); notify('Your Like Could Not Be Saved. Please Try Again.', 'error'); }
    finally { setSavingLike(false); }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { notify('Create A Cinema Account To Comment.'); navigateTo('/sign-up'); return; }
    const body = commentText.trim();
    if (!body || savingComment) return;
    setSavingComment(true);
    try { await addDiscoverContentComment(contentKey, user.id, body); setCommentText(''); await refresh(); notify('Your Comment Has Been Added.'); }
    catch { notify('Your Comment Could Not Be Added. Please Try Again.', 'error'); }
    finally { setSavingComment(false); }
  }

  async function openShare() {
    if (!user) { notify('Create A Cinema Account To Share With Friends.'); navigateTo('/sign-up'); return; }
    setShareOpen(true); setFriendsLoading(true);
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
      if (navigator.share) await navigator.share({ title: title, text: 'Discover This On Cinema.', url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Cinema Link Copied.'); }
      else notify('Sharing Is Not Available On This Browser.', 'error');
    } catch (error) { if (error instanceof Error && error.name !== 'AbortError') notify('Could Not Share This Content.', 'error'); }
  }

  return (
    <>
      <div className={`cinema-content-engagement flex flex-wrap items-center gap-2 p-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        <button type="button" onClick={() => void toggleLike()} disabled={savingLike} aria-pressed={liked} className="cinema-trailer-action" aria-label={liked ? 'Unlike this content' : 'Like this content'}>
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current text-sky-200' : ''}`} /> Like <span className="tabular-nums">{loading ? '…' : likeCount}</span>
        </button>
        <button type="button" onClick={() => setCommentOpen(true)} className="cinema-trailer-action" aria-label={`Comment on ${title}`}>
          <MessageCircle className="h-3.5 w-3.5" /> Comment <span className="tabular-nums">{loading ? '…' : comments.length}</span>
        </button>
        <button type="button" onClick={() => void openShare()} className="cinema-trailer-action" aria-label={`Share ${title} with friends`}>
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {commentOpen && <Modal label={`Comments On ${title}`} onClose={() => setCommentOpen(false)}>
        <div className="space-y-4 pt-2">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Cinema Conversation</p><h2 className="mt-1 pr-10 text-xl font-extrabold text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">Share Your Thoughts With The Cinema Community.</p></div>
          <div className="max-h-[42dvh] space-y-3 overflow-y-auto pr-1">
            {loading && <p className="py-5 text-center text-xs text-slate-400">Loading Comments…</p>}
            {!loading && comments.length === 0 && <p className="rounded-xl border border-white/10 bg-white/[.03] p-5 text-center text-xs text-slate-400">No Comments Yet. Start The Conversation.</p>}
            {comments.map((comment) => <article key={comment.id} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><p className="text-xs font-bold text-sky-100">{comment.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{comment.body}</p><p className="mt-2 text-[10px] text-slate-500">{new Date(comment.created_at).toLocaleString()}</p></article>)}
          </div>
          <form onSubmit={(event) => void submitComment(event)} className="flex gap-2 border-t border-white/10 pt-3">
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={user ? 'Add A Thought…' : 'Sign In To Comment'} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" />
            <button type="submit" disabled={!commentText.trim() || savingComment} aria-label="Post comment" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-200 text-[#07101b] disabled:opacity-50"><Send className="h-4 w-4" /></button>
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
