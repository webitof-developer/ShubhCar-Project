const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const controller = require('./categoryAttribute.controller');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const {
  createCategoryAttributeSchema,
  updateCategoryAttributeSchema,
} = require('./categoryAttribute.validator');
const ROLES = require('../../constants/roles');

const router = express.Router();

/**
 * @openapi
 * /api/v1/category-attributes/{categoryId}:
 *   get:
 *     summary: List attributes for a category
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attributes }
 */
router.get('/:categoryId', adminLimiter, auth([ROLES.ADMIN]), validateId('categoryId'), controller.list);

/**
 * @openapi
 * /api/v1/category-attributes:
 *   post:
 *     summary: Create category attribute
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryAttribute'
 *     responses:
 *       201: { description: Created }
 */
router.post('/', adminLimiter, auth([ROLES.ADMIN]), validate(createCategoryAttributeSchema), controller.create);

/**
 * @openapi
 * /api/v1/category-attributes/{attributeId}:
 *   put:
 *     summary: Update category attribute
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: attributeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryAttribute'
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:attributeId', adminLimiter, auth([ROLES.ADMIN]), validateId('attributeId'), validate(updateCategoryAttributeSchema), controller.update);

/**
 * @openapi
 * /api/v1/category-attributes/{attributeId}:
 *   delete:
 *     summary: Delete category attribute
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: attributeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:attributeId', adminLimiter, auth([ROLES.ADMIN]), validateId('attributeId'), controller.remove);

module.exports = router;
