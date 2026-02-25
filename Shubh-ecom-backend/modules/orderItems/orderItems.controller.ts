import type { OrderItemsRequestShape } from './orderItems.types';
import type { Response } from 'express';
import type { OrderItemsRequest } from './orderItems.types';
// backend/modules/orderItems/orderItems.controller.js
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./orderItems.service');

exports.updateStatus = asyncHandler(async (req: OrderItemsRequest, res: Response) => {
  const data = await service.updateStatus({
    orderItemId: req.params.id,
    newStatus: req.body.status,
  });

  return success(res, data, 'Order item status updated');
});
