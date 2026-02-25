const reviewsService = require('../modules/reviews/reviews.service');
jest.mock('../models/Product.model', () => ({
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
}));
jest.mock('../models/OrderItem.model', () => ({
  find: jest.fn(() => ({
    populate: jest.fn(() => ({
      select: jest.fn(() => ({
        lean: jest.fn().mockResolvedValue([
          {
            status: 'delivered',
            orderId: { _id: '507f1f77bcf86cd799439012', orderStatus: 'delivered' },
          },
        ]),
      })),
    })),
  })),
}));

jest.mock('../modules/reviews/reviews.repo', () => ({
  findByProduct: jest.fn(),
  findByUserProduct: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getAggregate: jest.fn(),
}));

const repo = require('../modules/reviews/reviews.repo');

describe('ReviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repo.getAggregate.mockResolvedValue([]);
  });

  test('creates review when none exists', async () => {
    repo.findByUserProduct.mockResolvedValue(null);
    const created = { _id: '1', productId: '507f1f77bcf86cd799439011' };
    repo.create.mockResolvedValue(created);

    const res = await reviewsService.create({
      user: { id: '507f1f77bcf86cd799439021' },
      payload: { productId: '507f1f77bcf86cd799439011', rating: 5 },
    });

    expect(repo.findByUserProduct).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439021',
      '507f1f77bcf86cd799439011',
    );
    expect(res).toEqual(created);
  });

  test('rejects duplicate review by same user', async () => {
    repo.findByUserProduct.mockResolvedValue({ _id: 'existing' });
    await expect(
      reviewsService.create({
        user: { id: '507f1f77bcf86cd799439021' },
        payload: { productId: '507f1f77bcf86cd799439011', rating: 4 },
      }),
    ).rejects.toThrow('You have already reviewed this product');
  });

  test('forbids update by non-owner', async () => {
    repo.findById.mockResolvedValue({ _id: 'r1', userId: 'other' });
    await expect(
      reviewsService.update({
        user: { id: 'u1', role: 'customer' },
        reviewId: 'r1',
        payload: { rating: 3 },
      }),
    ).rejects.toThrow('Forbidden');
  });

  test('aggregate ratings returns defaults', async () => {
    repo.getAggregate.mockResolvedValue([]);
    const agg = await reviewsService.getAggregate('p1');
    expect(agg).toEqual({ averageRating: 0, reviewCount: 0 });
  });

  test('aggregate ratings returns computed values', async () => {
    repo.getAggregate.mockResolvedValue([{ avgRating: 4.25, count: 8 }]);
    const agg = await reviewsService.getAggregate('p1');
    expect(agg).toEqual({ averageRating: 4.25, reviewCount: 8 });
  });
});
