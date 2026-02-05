const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const ROLES = require('../../constants/roles');
const controller = require('./tags.controller');

const router = express.Router();

/**
 * @openapi
 * /api/v1/tags:
 *   get:
 *     summary: List tags
 *     tags: [Catalog]
 *     responses:
 *       200: { description: Tags }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /api/v1/tags:
 *   post:
 *     summary: Create tag
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
 *       201: { description: Created }
 */
router.post('/', auth([ROLES.ADMIN]), controller.create);

/**
 * @openapi
 * /api/v1/tags/{id}:
 *   put:
 *     summary: Update tag
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
 *       200: { description: Updated }
 */
router.put('/:id', auth([ROLES.ADMIN]), controller.update);

/**
 * @openapi
 * /api/v1/tags/{id}:
 *   delete:
 *     summary: Delete tag
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
