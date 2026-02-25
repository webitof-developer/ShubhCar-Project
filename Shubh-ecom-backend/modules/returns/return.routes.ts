import type { ReturnsRequestShape } from './returns.types';
const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const validate = require('../../middlewares/validate.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const controller = require('./return.controller');
const ROLES = require('../../constants/roles');
const {
  createReturnSchema,
  adminDecisionSchema,

  completeSchema,
} = require('./return.validator');

const router = express.Router();

/**
 * @openapi
 * /api/v1/returns:
 *   post:
 *     summary: Create a return request
 *     tags: [Returns]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     orderItemId: { type: string }
 *                     quantity: { type: integer }
 *                     reason: { type: string }
 *             required: [orderId, items]
 *     responses:
 *       201:
 *         description: Return created
 */
router.post('/', auth(), validate(createReturnSchema), controller.create);

/**
 * @openapi
 * /api/v1/returns/{id}:
 *   get:
 *     summary: Get a return by id
 *     tags: [Returns]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Return
 */
router.get('/:id', auth(), validateId('id'), controller.get);

/**
 * @openapi
 * /api/v1/returns:
 *   get:
 *     summary: Admin list returns
 *     tags: [Returns]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     responses:
 *       200:
 *         description: Returns list
 */
router.get('/', adminLimiter, auth([ROLES.ADMIN]), controller.list);

/**
 * @openapi
 * /api/v1/returns/{id}/decision:
 *   post:
 *     summary: Admin approve or reject a return
 *     tags: [Returns]
 *     security: [ { bearerAuth: [] as any[] } ]
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
 *               status: { type: string, enum: [approved, rejected] }
 *               adminNote: { type: string }
 *             required: [status]
 *     responses:
 *       200:
 *         description: Decision saved
 */
router.post(
  '/:id/decision',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('id'),
  validate(adminDecisionSchema),
  controller.adminDecision,
);

//   confirm receipt/participation


/**
 * @openapi
 * /api/v1/returns/{id}/complete:
 *   post:
 *     summary: Admin mark return as completed
 *     tags: [Returns]
 *     security: [ { bearerAuth: [] as any[] } ]
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
 *               adminNote: { type: string }
 *     responses:
 *       200:
 *         description: Return completed
 */
router.post(
  '/:id/complete',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('id'),
  validate(completeSchema),
  controller.complete,
);

module.exports = router;
