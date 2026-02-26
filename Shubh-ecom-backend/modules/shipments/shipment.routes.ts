const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const controller = require('./shipment.controller');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createShipmentSchema,
  updateShipmentSchema,
} = require('./shipment.validator');
const ROLES = require('../../constants/roles');

const router = express.Router();

/* =======================
   ADMIN CMS ROUTES
======================= */

// list all shipments (global)
/**
 * @openapi
 * /api/v1/shipments:
 *   get:
 *     summary: List shipments
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Shipments list
 */
router.get('/', adminLimiter, auth([ROLES.ADMIN]), controller.list);

// ✅ CMS: list shipments by ORDER
/**
 * @openapi
 * /api/v1/shipments/admin/order/{orderId}:
 *   get:
 *     summary: List shipments for an order
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipments for order
 */
router.get('/admin/order/:orderId', adminLimiter, auth([ROLES.ADMIN]), validateId('orderId'), controller.adminListByOrder);

// get single shipment
/**
 * @openapi
 * /api/v1/shipments/{id}:
 *   get:
 *     summary: Get shipment by id
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipment
 */
router.get('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), controller.get);

// create shipment
/**
 * @openapi
 * /api/v1/shipments/{orderItemId}:
 *   post:
 *     summary: Create shipment for an order item
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderItemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrier: { type: string }
 *               trackingNumber: { type: string }
 *               eta: { type: string, format: date }
 *               items:
 *                 type: array
 *                 items: { type: object }
 *             required: [carrier, trackingNumber]
 *     responses:
 *       201:
 *         description: Shipment created
 */
router.post('/:orderItemId', adminLimiter, auth([ROLES.ADMIN]), validateId('orderItemId'), validate(createShipmentSchema), controller.create);

// update shipment status
/**
 * @openapi
 * /api/v1/shipments/{orderItemId}/status:
 *   patch:
 *     summary: Update shipment status
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderItemId
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
 *               note: { type: string }
 *             required: [status]
 *     responses:
 *       200:
 *         description: Shipment updated
 */
router.patch('/:orderItemId/status', adminLimiter, auth([ROLES.ADMIN]), validateId('orderItemId'), validate(updateShipmentSchema), controller.updateStatus);

// delete shipment
/**
 * @openapi
 * /api/v1/shipments/{id}:
 *   delete:
 *     summary: Delete shipment
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), controller.remove);

/* =======================
   USER ROUTES
======================= */

// tracking
/**
 * @openapi
 * /api/v1/shipments/track/{orderItemId}:
 *   get:
 *     summary: Track shipment for an order item
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderItemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tracking info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShipmentTracking'
 */
router.get('/track/:orderItemId', auth(), validateId('orderItemId'), controller.trackByOrderItem);

// calculation
/**
 * @openapi
 * /api/v1/shipments/calculate:
 *   post:
 *     summary: Calculate shipping fee
 *     tags: [Shipments]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subtotal: { type: number }
 *     responses:
 *       200:
 *         description: Shipping fee
 */
router.post('/calculate', auth(), controller.calculate);

module.exports = router;

