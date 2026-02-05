//src/components/product/WriteReviewModal.jsx

"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { createReview } from '@/services/reviewService';


export const WriteReviewModal = ({ productId, productName, onSubmitted }) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { accessToken, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!productId) {
      toast.error('Product not found');
      return;
    }
    if (!isAuthenticated || !accessToken) {
      toast.error('Please login to submit a review');
      return;
    }
    try {
      setSubmitting(true);
      await createReview(accessToken, {
        productId,
        rating,
        title: title?.trim(),
        comment: content?.trim(),
      });
      toast.success('Review submitted successfully', {
        description: 'Thanks! Your review has been added.',
      });
      setOpen(false);
      setRating(0);
      setTitle('');
      setContent('');
      if (onSubmitted) onSubmitted();
    } catch (error) {
      const status = error?.status;
      const message = error?.data?.message || error?.message || 'Failed to submit review';
      if (status === 401) {
        toast.error('Please login to submit a review');
      } else if (status === 403) {
        toast.error(message || 'Only verified buyers can review this product');
      } else if (status === 409) {
        toast.error(message || 'You have already reviewed this product');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="w-4 h-4" />
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">{productName}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label className="mb-2 block">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="reviewTitle">Review Title</Label>
            <Input
              id="reviewTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="mt-1"
            />
          </div>

          {/* Review Content */}
          <div>
            <Label htmlFor="reviewContent">Your Review</Label>
            <Textarea
              id="reviewContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              rows={4}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
