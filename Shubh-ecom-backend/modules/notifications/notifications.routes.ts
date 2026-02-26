const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const controller = require('./notifications.controller');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const validate = require('../../middlewares/validate.middleware');
const ROLES = require('../../constants/roles');
const {
  createNotificationSchema,
  updateNotificationSchema,
  markAllSchema,
} = require('./notifications.validator');

const router = express.Router();

// Users can list/get their own; admin full CRUD
/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     summary: List notifications
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: List notifications }
 */
router.get('/', auth(), controller.list);

/**
 * @openapi
 * /api/v1/notifications/summary:
 *   get:
 *     summary: Notification summary
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Counts }
 */
router.get('/summary', auth(), controller.summary);

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get notification by id
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification }
 */
router.get('/:id', auth(), validateId('id'), controller.get);
/**
 * @openapi
 * /api/v1/notifications:
 *   post:
 *     summary: Create/broadcast notification
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201: { description: Created }
 */
router.post('/', adminLimiter, auth([ROLES.ADMIN]), validate(createNotificationSchema), controller.create);
/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   put:
 *     summary: Update notification
 *     tags: [Notifications]
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
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), validate(updateNotificationSchema), controller.update);
/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), controller.remove);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Marked read }
 */
router.post('/:id/read', auth(), validateId('id'), controller.markRead);

/**
 * @openapi
 * /api/v1/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: All read }
 */
router.post('/mark-all-read', auth(), validate(markAllSchema), controller.markAllRead);

module.exports = router;

