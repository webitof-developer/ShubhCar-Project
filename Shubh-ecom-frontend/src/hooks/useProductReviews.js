import { useCallback, useEffect, useState } from 'react';
import { getProductReviews, getReviewStats } from '@/services/reviewService';

const DEFAULT_STATS = { average: 0, total: 0, breakdown: {} };

export const useProductReviews = (
  productId,
  { silent = false, fallbackAvg = 0, fallbackCount = 0 } = {},
) => {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(DEFAULT_STATS);

  const refreshReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setReviewStats(DEFAULT_STATS);
      return;
    }

    try {
      const list = await getProductReviews(productId);
      const safeList = Array.isArray(list) ? list : [];
      setReviews(safeList);
      setReviewStats(getReviewStats(safeList));
    } catch (error) {
      if (!silent) {
        console.error('[useProductReviews] Failed to load reviews', error);
      }
    }
  }, [productId, silent]);

  useEffect(() => {
    refreshReviews();
  }, [refreshReviews]);

  const ratingAvg = reviewStats.average || fallbackAvg || 0;
  const ratingCount = reviewStats.total || fallbackCount || 0;

  return { reviews, reviewStats, ratingAvg, ratingCount, refreshReviews };
};

export default useProductReviews;
