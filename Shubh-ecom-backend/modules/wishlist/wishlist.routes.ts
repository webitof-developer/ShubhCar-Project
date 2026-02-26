const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const controller = require('./wishlist.controller');
const { addSchema } = require('./wishlist.validator');

const router = express.Router();

/**
 * @openapi
 * /api/v1/wishlist:
 *   get:
 *     summary: Get wishlist
 *     tags: [Wishlist]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Wishlist items
 */
router.get('/', auth(), controller.list);

/**
 * @openapi
 * /api/v1/wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *             required: [productId]
 *     responses:
 *       201:
 *         description: Added
 */
router.post('/', auth(), validate(addSchema), controller.add);

/**
 * @openapi
 * /api/v1/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/:productId', auth(), validateId('productId'), controller.remove);

module.exports = router;

