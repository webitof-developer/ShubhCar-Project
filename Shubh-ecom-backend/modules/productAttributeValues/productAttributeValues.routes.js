const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const controller = require('./productAttributeValues.controller');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createSchema, updateSchema } = require('./productAttributeValues.validator');
const ROLES = require('../../constants/roles');

const router = express.Router();

/**
 * @openapi
 * /api/v1/product-attribute-values:
 *   get:
 *     summary: List attribute values
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Attribute values }
 */
router.get('/', adminLimiter, auth([ROLES.ADMIN]), controller.list);

/**
 * @openapi
 * /api/v1/product-attribute-values/{id}:
 *   get:
 *     summary: Get attribute value by id
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attribute value }
 */
router.get('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), controller.get);

/**
 * @openapi
 * /api/v1/product-attribute-values:
 *   post:
 *     summary: Create attribute value
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               attributeId: { type: string }
 *             required: [name, attributeId]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', adminLimiter, auth([ROLES.ADMIN]), validate(createSchema), controller.create);

/**
 * @openapi
 * /api/v1/product-attribute-values/{id}:
 *   put:
 *     summary: Update attribute value
 *     tags: [Products]
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
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', adminLimiter, auth([ROLES.ADMIN]), validateId('id'), validate(updateSchema), controller.update);

/**
 * @openapi
 * /api/v1/product-attribute-values/{id}:
 *   delete:
 *     summary: Delete attribute value
 *     tags: [Products]
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

module.exports = router;
