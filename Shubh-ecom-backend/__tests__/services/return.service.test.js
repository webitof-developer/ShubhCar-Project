jest.mock('mongoose', () => ({
  startSession: jest.fn(),
}));

jest.mock('../../modules/returns/return.repo', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  list: jest.fn(),
}));
jest.mock('../../modules/orders/order.repo', () => ({
  findById: jest.fn(),
}));
jest.mock('../../modules/orderItems/orderItems.repo', () => ({
  findByOrderId: jest.fn(),
}));
jest.mock('../../modules/inventory/inventory.service', () => ({
  release: jest.fn(),
}));
jest.mock('../../models/OrderItem.model', () => ({
  findByIdAndUpdate: jest.fn(),
}));

const mongoose = require('mongoose');
const returnService = require('../../modules/returns/return.service');
const returnRepo = require('../../modules/returns/return.repo');
const orderRepo = require('../../modules/orders/order.repo');
const orderItemsRepo = require('../../modules/orderItems/orderItems.repo');
const inventoryService = require('../../modules/inventory/inventory.service');
const OrderItemModel = require('../../models/OrderItem.model');

const mockSession = () => {
  const session = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
  mongoose.startSession.mockResolvedValue(session);
  return session;
};

describe('ReturnService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates return request for user order and normalizes items', async () => {
    orderRepo.findById.mockResolvedValue({ _id: 'order1', userId: 'user1' });
    orderItemsRepo.findByOrderId.mockResolvedValue([
      { _id: 'oi1', quantity: 2 },
    ]);
    returnRepo.create.mockResolvedValue({ _id: 'ret1' });

    const result = await returnService.requestReturn({
      user: { id: 'user1' },
      payload: {
        orderId: 'order1',
        items: [
          {
            orderItemId: 'oi1',
            quantity: 1,
            reason: 'damaged',
          },
        ],
      },
    });

    expect(returnRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order1',
        userId: 'user1',
        items: [
          expect.objectContaining({
            orderItemId: 'oi1',
            quantity: 1,
            reason: 'damaged',
            status: 'pending',
          }),
        ],
      }),
    );
    expect(result).toEqual({ _id: 'ret1' });
  });

  it('approves return as admin', async () => {
    returnRepo.findById.mockResolvedValue({ _id: 'ret1' });
    returnRepo.update.mockResolvedValue({ _id: 'ret1', status: 'approved' });

    const result = await returnService.adminDecision({
      admin: { id: 'admin1' },
      id: 'ret1',
      payload: { status: 'approved', adminNote: 'ok' },
    });

    expect(returnRepo.update).toHaveBeenCalledWith('ret1', {
      status: 'approved',
      adminNote: 'ok',
    });
    expect(result.status).toBe('approved');
  });

  it('completes return, restocks inventory, and marks items returned', async () => {
    const session = mockSession();
    returnRepo.findById.mockResolvedValue({
      _id: 'ret1',
      orderId: 'order1',
      adminNote: null,
      items: [{ orderItemId: 'oi1', quantity: 1 }],
    });
    orderItemsRepo.findByOrderId.mockResolvedValue([
      { _id: 'oi1', productVariantId: 'pv1' },
    ]);
    returnRepo.update.mockResolvedValue({ _id: 'ret1', status: 'completed' });

    const result = await returnService.complete({
      admin: { id: 'admin1' },
      id: 'ret1',
      payload: { adminNote: 'done' },
    });

    expect(inventoryService.release).toHaveBeenCalledWith(
      'pv1',
      1,
      session,
      expect.objectContaining({ orderId: 'order1' }),
    );
    expect(OrderItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'oi1',
      { status: 'returned' },
      { session },
    );
    expect(returnRepo.update).toHaveBeenCalledWith(
      'ret1',
      expect.objectContaining({ status: 'completed', adminNote: 'done' }),
      { session },
    );
    expect(result.status).toBe('completed');
  });
});
