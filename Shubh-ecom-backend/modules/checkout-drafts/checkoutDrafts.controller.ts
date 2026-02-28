import type { Response, Request } from 'express';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const checkoutDraftService = require('./checkoutDrafts.service');

exports.createDraft = asyncHandler(async (req: Request & { user?: any; id?: string }, res: Response) => {
  const data = await checkoutDraftService.createDraft({
    user: req.user,
    sessionId: req.headers['x-session-id'],
    payload: req.body,
  });
  return success(res, data, 'Checkout draft created', 201);
});

exports.getDraft = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const data = await checkoutDraftService.getDraft({
    user: req.user,
    draftId: req.params.draftId,
  });
  return success(res, data, 'Checkout draft fetched');
});

exports.retryPayment = asyncHandler(async (req: Request & { user?: any; id?: string }, res: Response) => {
  const data = await checkoutDraftService.retryPayment({
    user: req.user,
    draftId: req.params.draftId,
    context: {
      requestId: req.id,
      route: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    },
  });
  return success(res, data, 'Payment retry initiated');
});
