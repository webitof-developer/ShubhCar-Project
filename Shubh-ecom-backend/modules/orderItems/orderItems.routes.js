// backend/modules/orderItems/orderItems.routes.js
const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const controller = require('./orderItems.controller');
const { updateOrderItemStatusSchema } = require('./orderItems.validator');
const ROLES = require('../../constants/roles');

const router = express.Router();

/*
  RULES:
  - admin: can update item status (refund/return/fulfillment)
*/
router.patch(
  '/:id/status',
  auth([ROLES.ADMIN]),
  validateId('id'),
  validate(updateOrderItemStatusSchema),
  controller.updateStatus,
);

/**
 * @openapi
 * /api/v1/order-items/{id}/status:
 *   patch:
 *     summary: Update order item status
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *             required: [status]
 *     responses:
 *       200: { description: Status updated }
 */

module.exports = router;
