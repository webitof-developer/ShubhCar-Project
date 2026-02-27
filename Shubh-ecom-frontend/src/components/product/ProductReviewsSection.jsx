import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WriteReviewModal } from '@/components/product/WriteReviewModal';

export const ProductReviewsSection = ({
  reviews,
  ratingAvg,
  ratingCount,
  product,
  refreshReviews,
}) => {
  return (
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
                {r.verified && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>}
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
  );
};
