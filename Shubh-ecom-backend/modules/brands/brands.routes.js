const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const ROLES = require('../../constants/roles');
const controller = require('./brands.controller');

const router = express.Router();

/**
 * @openapi
 * /api/v1/brands:
 *   get:
 *     summary: List brands
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: Brands
 */
router.get('/', controller.list);

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Get brand by id
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand
 */
router.get('/:id', controller.get);

/**
 * @openapi
 * /api/v1/brands:
 *   post:
 *     summary: Create brand
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *             required: [name, slug]
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', auth([ROLES.ADMIN]), controller.create);

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   put:
 *     summary: Update brand
 *     tags: [Catalog]
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
 *               slug: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', auth([ROLES.ADMIN]), controller.update);

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   delete:
 *     summary: Delete brand
 *     tags: [Catalog]
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
router.delete('/:id', auth([ROLES.ADMIN]), controller.remove);

module.exports = router;
