const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const controller = require('./reviews.controller');
const {
  createReviewSchema,
  updateReviewSchema,
} = require('./reviews.validator');
const ROLES = require('../../constants/roles');

const router = express.Router();

// Aggregate MUST come first
/**
 * @openapi
 * /api/v1/reviews/product/{productId}/aggregate:
 *   get:
 *     summary: Get aggregate rating for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Aggregate }
 */
router.get('/product/:productId/aggregate', validateId('productId'), controller.getAggregate);

// List reviews for a product
/**
 * @openapi
 * /api/v1/reviews/product/{productId}:
 *   get:
 *     summary: List reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reviews list }
 */
router.get('/product/:productId', validateId('productId'), controller.listByProduct);

// Customer actions
/**
 * @openapi
 * /api/v1/reviews:
 *   post:
 *     summary: Create review
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *             required: [productId, rating]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', auth(), validate(createReviewSchema), controller.create);

/**
 * @openapi
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', auth(), validateId('id'), validate(updateReviewSchema), controller.update);

/**
 * @openapi
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', auth(), validateId('id'), controller.remove);

// Admin CMS
/**
 * @openapi
 * /api/v1/reviews/admin:
 *   get:
 *     summary: List reviews (Admin)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Admin reviews list }
 */
router.get('/admin', adminLimiter, auth([ROLES.ADMIN]), controller.adminList);

/**
 * @openapi
 * /api/v1/reviews/admin/{reviewId}:
 *   get:
 *     summary: Get review (Admin)
 *     tags: [Reviews]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Review }
 */
router.get('/admin/:reviewId', adminLimiter, auth([ROLES.ADMIN]), validateId('reviewId'), controller.adminGet);

module.exports = router;

