//src/data/reviews.js
/**
 * Static review data - matches backend MongoDB structure
 * This file will be replaced with API calls through reviewService
 */

export const reviews = [
  { id: 'r1', author: 'Rajesh K.', rating: 5, title: 'Excellent quality', content: 'Perfect fit for my Swift. Braking performance improved significantly. The installation was smooth and the product exceeded my expectations.', date: '2024-01-15', verified: true },
  { id: 'r2', author: 'Amit S.', rating: 4, title: 'Good product', content: 'Works well, delivery was quick. Minor fitment adjustments needed but overall satisfied.', date: '2024-01-10', verified: true },
  { id: 'r3', author: 'Priya M.', rating: 5, title: 'Perfect fit', content: 'Exact replacement for my Creta. Easy to install. Highly recommend this seller.', date: '2024-02-01', verified: true },
  { id: 'r4', author: 'Vikram P.', rating: 5, title: 'Great improvement', content: 'My Nexon rides like new after installing these shock absorbers. Excellent quality and value for money.', date: '2024-01-20', verified: true },
  { id: 'r5', author: 'Suresh R.', rating: 5, title: 'Perfect OEM quality', content: 'Exact match to the original. Excellent build quality. This is genuine OEM part, no compromises.', date: '2024-02-05', verified: true },
  { id: 'r6', author: 'Manoj K.', rating: 5, title: 'Bosch quality', content: 'Always trust Bosch for filters. Perfect fit and excellent filtration performance.', date: '2024-01-25', verified: true },
  { id: 'r7', author: 'Arun S.', rating: 5, title: 'Low dust, great stopping', content: 'These ceramic pads are amazing. No more dusty alloys! The braking performance is excellent too.', date: '2024-02-10', verified: true },
  { id: 'r8', author: 'Karthik V.', rating: 5, title: 'Complete kit', content: 'Everything you need for timing belt replacement. Quality parts from Gates.', date: '2024-01-28', verified: true },
  { id: 'r9', author: 'Deepak M.', rating: 4, title: 'Good aftermarket option', content: 'Fits well, minor adjustment needed. Good value for money. Would recommend.', date: '2024-02-08', verified: true },
  { id: 'r10', author: 'Ravi T.', rating: 5, title: 'Denso quality', content: 'Charging issue completely resolved. Denso is reliable and this alternator is perfect.', date: '2024-01-30', verified: true },
  { id: 'r11', author: 'Sachin P.', rating: 5, title: 'Perfect OEM fit', content: 'Genuine Tata part. Fitted perfectly without any issues. Quality is top-notch.', date: '2024-02-12', verified: true },
  { id: 'r12', author: 'Anand K.', rating: 5, title: 'Fixed my fuel delivery issue', content: 'Bosch quality. Car runs smooth now. Installation was straightforward.', date: '2024-02-03', verified: true },
  { id: 'r13', author: 'Sanjay G.', rating: 3, title: 'Average experience', content: 'Product is okay but delivery was delayed. Could be better packaged.', date: '2024-02-15', verified: true },
  { id: 'r14', author: 'Rahul D.', rating: 2, title: 'Not as expected', content: 'Fitment issues with my vehicle. Had to return it. Customer service was helpful though.', date: '2024-01-18', verified: false },
  { id: 'r15', author: 'Nitin B.', rating: 4, title: 'Solid product', content: 'Good quality, fair pricing. Minor delay in shipping but product is worth it.', date: '2024-02-07', verified: true },
];

// Get all reviews for a product
export const getProductReviews = (productId) => {
  // In real implementation, this would filter by productId
  // For now, return subset of reviews
  return reviews.slice(0, 5);
};

// Get reviews sorted by a criteria
export const ReviewSortOption = 'latest' | 'highest' | 'lowest';

export const getSortedReviews = (reviewList, sortBy) => {
  const sorted = [...reviewList];
  
  switch (sortBy) {
    case 'latest':
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating);
    default:
      return sorted;
  }
};

// Get reviews filtered by rating
export const getFilteredReviews = (reviewList, minRating) => {
  return reviewList.filter(r => r.rating >= minRating);
};

// Get review statistics


export const getReviewStats = (reviewList) => {
  const total = reviewList.length;
  const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewList.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });
  
  return { average, total, distribution };
};
