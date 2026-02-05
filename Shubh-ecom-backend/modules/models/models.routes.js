const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const ROLES = require('../../constants/roles');
const controller = require('./models.controller');

const router = express.Router();

/**
 * @openapi
 * /api/v1/models:
 *   get:
 *     summary: List models
 *     tags: [Catalog]
 *     responses:
 *       200: { description: Models }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /api/v1/models/{id}:
 *   get:
 *     summary: Get model by id
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Model }
 */
router.get('/:id', controller.get);

/**
 * @openapi
 * /api/v1/models:
 *   post:
 *     summary: Create model
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
 *               brandId: { type: string }
 *             required: [name, slug]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', auth([ROLES.ADMIN]), controller.create);

/**
 * @openapi
 * /api/v1/models/{id}:
 *   put:
 *     summary: Update model
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
 *               brandId: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', auth([ROLES.ADMIN]), controller.update);

/**
 * @openapi
 * /api/v1/models/{id}:
 *   delete:
 *     summary: Delete model
 *     tags: [Catalog]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', auth([ROLES.ADMIN]), controller.remove);

module.exports = router;
