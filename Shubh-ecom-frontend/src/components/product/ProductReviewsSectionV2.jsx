import { useState } from 'react';
import { Star, ShieldCheck, MessageSquare, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WriteReviewModal } from '@/components/product/WriteReviewModal';
import { useAuth } from '@/context/AuthContext';
import { deleteReview, updateReview } from '@/services/reviewService';
import { toast } from 'sonner';

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-muted-foreground shrink-0">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-muted-foreground shrink-0">{count}</span>
    </div>
  );
};

export const ProductReviewsSectionV2 = ({
  reviews,
  ratingAvg,
  ratingCount,
  reviewStats,
  product,
  refreshReviews,
  previewCount = 5,
}) => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  const currentUserId = String(user?._id || user?.id || '');
  const resolveReviewId = (review) => String(review?._id || review?.id || '');
  const resolveReviewUserId = (review) => String(
    review?.userId?._id ||
    review?.userId?.id ||
    review?.userId ||
    '',
  );

  const canManageReview = (review) =>
    Boolean(isAuthenticated && currentUserId && resolveReviewUserId(review) === currentUserId);

  const openEdit = (review) => {
    setEditingReviewId(resolveReviewId(review));
    setEditRating(Number(review?.rating || 0));
    setEditTitle(String(review?.title || ''));
    setEditComment(String(review?.comment || review?.content || ''));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !editingReviewId) return;
    if (!editRating || editRating < 1 || editRating > 5) {
      toast.error('Please select a valid rating');
      return;
    }

    try {
      setActionLoading(true);
      await updateReview(accessToken, editingReviewId, {
        rating: editRating,
        title: editTitle.trim(),
        comment: editComment.trim(),
      });
      toast.success('Review updated');
      setEditOpen(false);
      setEditingReviewId(null);
      await refreshReviews();
    } catch (error) {
      toast.error(error?.message || 'Failed to update review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deleteReviewId) return;
    try {
      setActionLoading(true);
      await deleteReview(accessToken, deleteReviewId);
      toast.success('Review deleted');
      setDeleteReviewId(null);
      await refreshReviews();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete review');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
    <div className="flex flex-col md:flex-row gap-8">
      {/* Summary sidebar */}
      <div className="md:w-52 shrink-0">
        <div className="bg-muted/30 rounded-xl p-4 border border-border/30 mb-4">
          <div className="text-4xl text-zinc-500 font-extrabold text-foreground text-center mb-1">
            {ratingCount > 0 ? Number(ratingAvg).toFixed(1) : '—'}
          </div>
          <div className="flex justify-center mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-4 h-4 ${ratingCount > 0 && s <= Math.round(ratingAvg) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {ratingCount > 0 ? `${ratingCount} review${ratingCount !== 1 ? 's' : ''}` : 'No ratings yet'}
          </p>
        </div>
        {ratingCount > 0 ? (
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map(s => (
              <RatingBar
                key={s}
                star={s}
                count={reviewStats?.breakdown?.[s] || 0}
                total={ratingCount}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground/60 italic py-2">Be the first to review!</p>
        )}
        <div className="mt-4">
          <WriteReviewModal
            productId={product?._id}
            productName={product?.name}
            onSubmitted={refreshReviews}
          />
        </div>
      </div>

      {/* Review list */}
      <div className="flex-1">
        <div
          className={`space-y-4 transition-all ${!showAllReviews && reviews.length > previewCount ? 'max-h-[480px] overflow-y-auto pr-1' : ''}`}
          style={!showAllReviews && reviews.length > previewCount ? { scrollbarWidth: 'thin' } : {}}
        >
          {(showAllReviews ? reviews : reviews.slice(0, previewCount)).map((r, i) => (
            <div key={i} className="bg-muted/20 border border-border/30 p-4 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    {r.title && <span className="text-sm font-semibold">{r.title}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">{r.author || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
                {r.verified && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold px-2 py-0.5 shrink-0">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                {canManageReview(r) && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(r)}
                      disabled={actionLoading}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                      onClick={() => setDeleteReviewId(resolveReviewId(r))}
                      disabled={actionLoading}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.content || r.comment}</p>
            </div>
          ))}
        </div>

        {reviews.length > previewCount && (
          <button
            onClick={() => setShowAllReviews(v => !v)}
            className="mt-3 text-sm text-primary hover:underline font-medium"
          >
            {showAllReviews
              ? 'Show fewer reviews'
              : `Show all ${reviews.length} reviews`}
          </button>
        )}

        {reviews.length === 0 && (
          <div className="text-center py-14 bg-muted/20 rounded-2xl border border-dashed border-border">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Be the first to review this product.</p>
          </div>
        )}
      </div>
    </div>

    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="sm:max-w-md border border-zinc-200">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditRating(star)}
                  className="p-1"
                >
                  <Star className={`w-6 h-6 ${editRating >= star ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Comment</label>
            <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={4} />
          </div>

          <Button className="w-full" onClick={handleSaveEdit} disabled={actionLoading}>
            {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
      <AlertDialogContent className="border border-zinc-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Review?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your review will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={actionLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
