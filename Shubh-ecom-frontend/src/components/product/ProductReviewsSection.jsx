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

export const ProductReviewsSection = ({
  reviews,
  ratingAvg,
  ratingCount,
  product,
  refreshReviews,
}) => {
  const { user, accessToken, isAuthenticated } = useAuth();
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
    <div className="flex flex-col md:flex-row gap-12">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Customer Reviews</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="font-semibold text-slate-700">{Number(ratingAvg || 0).toFixed(1)} out of 5</p>
              <span className="text-slate-400 mx-2">•</span>
              <p className="text-slate-500">{ratingCount} ratings</p>
            </div>
          </div>
          <WriteReviewModal
            productId={product?._id}
            productName={product?.name}
            onSubmitted={refreshReviews}
          />
        </div>

        <div className="space-y-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-xl hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, stars) => <Star key={stars} className={`w-3.5 h-3.5 ${stars < r.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                    </div>
                    <span className="font-bold text-slate-900 text-sm ml-1">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{r.author || 'Anonymous'}</span>
                    <span>•</span>
                    <span>
                      {(r.createdAt || r.date)
                        ? new Date(r.createdAt || r.date).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.verified && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>}
                  {canManageReview(r) && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{r.content || r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium mb-1">No reviews yet</p>
              <p className="text-sm text-slate-400">Be the first to share your experience with this product.</p>
            </div>
          )}
        </div>
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
