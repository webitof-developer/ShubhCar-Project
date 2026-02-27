import APP_CONFIG, { getDataSourceConfig, logDataSource } from '@/config/app.config'
import { api } from '@/utils/apiClient'
import {
  getProductReviews as getDemoProductReviews,
  getReviewStats as getDemoReviewStats,
  getSortedReviews as getDemoSortedReviews,
  getFilteredReviews as getDemoFilteredReviews,
} from '@/data/reviews'

const baseUrl = APP_CONFIG.api.baseUrl

const applyFallback = (fallback, demoData, domain) => {
  if (fallback === 'demo') {
    logDataSource(domain, 'DEMO', 'fallback from failed real fetch')
    return demoData
  }
  if (fallback === 'empty') {
    logDataSource(domain, 'EMPTY', 'fallback configured as empty')
    return Array.isArray(demoData) ? [] : null
  }
  throw new Error(`${domain} fetch failed and fallback is 'error'`)
}

export const getProductReviews = async (productId) => {
  if (!productId) return []
  const config = getDataSourceConfig('reviews')
  if (config.source === 'demo') {
    logDataSource('REVIEWS', 'DEMO')
    return getDemoProductReviews(productId)
  }
  try {
    logDataSource('REVIEWS', 'REAL')
    const data = await api.get(`${baseUrl}/reviews/product/${productId}`)
    return data || []
  } catch (error) {
    console.error('[REVIEW_SERVICE] getProductReviews failed:', error.message)
    return applyFallback(config.fallback, getDemoProductReviews(productId), 'REVIEWS')
  }
}

export const getProductReviewAggregate = async (productId) => {
  if (!productId) return { averageRating: 0, reviewCount: 0 }
  const config = getDataSourceConfig('reviews')
  if (config.source === 'demo') {
    logDataSource('REVIEWS', 'DEMO')
    const stats = getDemoReviewStats(getDemoProductReviews(productId))
    return { averageRating: stats.average || 0, reviewCount: stats.total || 0 }
  }
  try {
    logDataSource('REVIEWS', 'REAL')
    const data = await api.get(`${baseUrl}/reviews/product/${productId}/aggregate`)
    return data || { averageRating: 0, reviewCount: 0 }
  } catch (error) {
    console.error('[REVIEW_SERVICE] getProductReviewAggregate failed:', error.message)
    const stats = getDemoReviewStats(getDemoProductReviews(productId))
    return applyFallback(config.fallback, { averageRating: stats.average || 0, reviewCount: stats.total || 0 }, 'REVIEWS')
  }
}

export const createReview = async (accessToken, payload) => {
  const data = await api.authPost(`${baseUrl}/reviews`, payload, accessToken)
  return data || null
}

export const getReviewStats = (reviewList = []) => {
  if (!Array.isArray(reviewList) || reviewList.length === 0) {
    return { average: 0, total: 0, breakdown: {} }
  }
  const total = reviewList.length
  const sum = reviewList.reduce((acc, r) => acc + (r.rating || 0), 0)
  const breakdown = reviewList.reduce((acc, r) => {
    const rating = String(r.rating || 0)
    acc[rating] = (acc[rating] || 0) + 1
    return acc
  }, {})
  return { average: sum / total, total, breakdown }
}

export const getSortedReviews = (reviewList = [], sortBy = 'latest') => {
  const list = [...reviewList]
  switch (sortBy) {
    case 'highest':
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'lowest':
      return list.sort((a, b) => (a.rating || 0) - (b.rating || 0))
    default:
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

export const getFilteredReviews = (reviewList = [], minRating = 0) => {
  return reviewList.filter((review) => (review.rating || 0) >= minRating)
}

export const getDemoReviewStatsSafe = (reviewList = []) => getDemoReviewStats(reviewList)
export const getDemoSortedReviewsSafe = (reviewList = [], sortBy = 'latest') =>
  getDemoSortedReviews(reviewList, sortBy)
export const getDemoFilteredReviewsSafe = (reviewList = [], minRating = 0) =>
  getDemoFilteredReviews(reviewList, minRating)
