const wishlistService = require('../modules/wishlist/wishlist.service');
jest.mock('../models/Product.model', () => ({
  find: jest.fn(() => ({
    lean: jest.fn().mockResolvedValue([]),
  })),
}));
jest.mock('../models/ProductImage.model', () => ({
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      lean: jest.fn().mockResolvedValue([]),
    })),
  })),
}));

jest.mock('../modules/wishlist/wishlist.repo', () => ({
  findByUser: jest.fn(),
  findOne: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
}));

const repo = require('../modules/wishlist/wishlist.repo');

describe('WishlistService', () => {
  beforeEach(() => jest.clearAllMocks());
  const userId = '507f1f77bcf86cd799439021';
  const productId1 = '507f1f77bcf86cd799439011';
  const productId2 = '507f1f77bcf86cd799439012';

  test('returns existing item on add', async () => {
    const existing = { _id: '1', productId: productId1 };
    repo.findOne.mockResolvedValue(existing);

    const res = await wishlistService.add(userId, productId1);
    expect(repo.findOne).toHaveBeenCalledWith(userId, productId1);
    expect(res).toEqual(existing);
    expect(repo.add).not.toHaveBeenCalled();
  });

  test('adds new wishlist item', async () => {
    repo.findOne.mockResolvedValue(null);
    const created = { _id: '2', productId: productId2 };
    repo.add.mockResolvedValue(created);

    const res = await wishlistService.add(userId, productId2);
    expect(repo.add).toHaveBeenCalledWith(userId, productId2);
    expect(res).toMatchObject(created);
  });

  test('remove throws when not found', async () => {
    repo.remove.mockResolvedValue(null);
    await expect(wishlistService.remove(userId, productId1)).rejects.toThrow(
      'Wishlist item not found',
    );
  });
});
