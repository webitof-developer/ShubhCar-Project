import { useCallback, useEffect, useState } from 'react';
import { getProductReviews, getReviewStats } from '@/services/reviewService';
import { logger } from '@/utils/logger';

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
        logger.error('[useProductReviews] Failed to load reviews', error);
      }
    }
  }, [productId, silent]);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      if (!productId) {
        if (!active) return;
        setReviews([]);
        setReviewStats(DEFAULT_STATS);
        return;
      }

      try {
        const list = await getProductReviews(productId);
        if (!active) return;
        const safeList = Array.isArray(list) ? list : [];
        setReviews(safeList);
        setReviewStats(getReviewStats(safeList));
      } catch (error) {
        if (!silent) {
          logger.error('[useProductReviews] Failed to load reviews', error);
        }
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [productId, silent]);

  const ratingAvg = reviewStats.average || fallbackAvg || 0;
  const ratingCount = reviewStats.total || fallbackCount || 0;

  return { reviews, reviewStats, ratingAvg, ratingCount, refreshReviews };
};

export default useProductReviews;
