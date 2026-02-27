import { useState } from 'react';
import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WriteReviewModal } from '@/components/product/WriteReviewModal';

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
  const [showAllReviews, setShowAllReviews] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Summary sidebar */}
      <div className="md:w-52 shrink-0">
        <div className="bg-muted/30 rounded-xl p-4 border border-border/30 mb-4">
          <div className="text-4xl font-extrabold text-foreground text-center mb-1">
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
  );
};
