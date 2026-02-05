const express = require('express');
const auth = require('../../../middlewares/auth.middleware');
const ROLES = require('../../../constants/roles');
const controller = require('../controllers/brand.controller');
const validateId = require('../../../middlewares/objectId.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/v1/vehicle-brands:
 *   get:
 *     summary: List vehicle brands
 *     tags: [Vehicle]
 *     responses:
 *       200: { description: Brands }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /api/v1/vehicle-brands:
 *   post:
 *     summary: Create vehicle brand
 *     tags: [Vehicle]
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
 *             required: [name]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', auth([ROLES.ADMIN]), controller.create);

/**
 * @openapi
 * /api/v1/vehicle-brands/{id}:
 *   get:
 *     summary: Get vehicle brand by id
 *     tags: [Vehicle]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Brand }
 */
router.get('/:id', validateId('id'), controller.get);

/**
 * @openapi
 * /api/v1/vehicle-brands/{id}:
 *   put:
 *     summary: Update vehicle brand
 *     tags: [Vehicle]
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
router.put('/:id', auth([ROLES.ADMIN]), validateId('id'), controller.update);

/**
 * @openapi
 * /api/v1/vehicle-brands/{id}:
 *   delete:
 *     summary: Delete vehicle brand
 *     tags: [Vehicle]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', auth([ROLES.ADMIN]), validateId('id'), controller.remove);

module.exports = router;
