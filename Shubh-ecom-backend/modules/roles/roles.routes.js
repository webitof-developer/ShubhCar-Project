const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const ROLES = require('../../constants/roles');
const controller = require('./roles.controller');

const router = express.Router();

/**
 * @openapi
 * /api/v1/roles:
 *   get:
 *     summary: List roles
 *     tags: [Roles]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Roles }
 */
router.get('/', auth(), authorize([ROLES.ADMIN]), controller.list);

/**
 * @openapi
 * /api/v1/roles:
 *   post:
 *     summary: Create role
 *     tags: [Roles]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *             required: [name]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', auth(), authorize([ROLES.ADMIN]), controller.create);

/**
 * @openapi
 * /api/v1/roles/{roleId}:
 *   get:
 *     summary: Get role by id
 *     tags: [Roles]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Role }
 */
router.get('/:roleId', auth(), authorize([ROLES.ADMIN]), controller.get);

/**
 * @openapi
 * /api/v1/roles/{roleId}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *               permissions: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:roleId', auth(), authorize([ROLES.ADMIN]), controller.update);

/**
 * @openapi
 * /api/v1/roles/{roleId}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:roleId', auth(), authorize([ROLES.ADMIN]), controller.remove);

module.exports = router;
