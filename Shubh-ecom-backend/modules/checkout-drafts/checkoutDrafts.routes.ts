const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const controller = require('./checkoutDrafts.controller');
const { createCheckoutDraftSchema } = require('./checkoutDrafts.validator');

const router = express.Router();

router.post(
  '/',
  auth(),
  validate(createCheckoutDraftSchema),
  controller.createDraft,
);

router.get(
  '/:draftId',
  auth(),
  validateId('draftId'),
  controller.getDraft,
);

router.post(
  '/:draftId/retry-payment',
  auth(),
  validateId('draftId'),
  controller.retryPayment,
);

module.exports = router;
