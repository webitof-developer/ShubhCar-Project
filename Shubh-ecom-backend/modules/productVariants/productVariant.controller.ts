import type { ProductVariantsRequestShape } from './productVariants.types';
import type { Response } from 'express';
import type { ProductVariantsRequest } from './productVariants.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./productVariant.service');
const { stockAdjustSchema } = require('./productVariant.validator');
const validate = require('../../middlewares/validate.middleware');
const auth = require('../../middlewares/auth.middleware');
const validateId = require('../../middlewares/objectId.middleware');

// Express router factory (avoids circular middleware require in routes)
const buildRouter = () => {
  const express = require('express');
  const router = express.Router();

  // Create variant for a product
  /**
   * @openapi
   * /api/v1/product-variants/product/{productId}:
   *   post:
   *     summary: Create product variant
   *     tags: [Products]
   *     security: [ { bearerAuth: [] as any[] } ]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       201: { description: Variant created }
   */
  router.post(
    '/product/:productId',
    auth(),  // Allow any authenticated user (admin or vendor)
    validateId('productId'),
    validate(require('./productVariant.validator').createVariantSchema),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.create(
        req.params.productId,
        req.body,
        req.user
      );
      return success(res, data, 'Variant created');
    }),
  );

  // List all variants for a product
  /**
   * @openapi
   * /api/v1/product-variants/product/{productId}:
   *   get:
   *     summary: List variants for a product
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Variants }
   */
  router.get(
    '/product/:productId',
    validateId('productId'),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.listByProduct(req.params.productId);
      return success(res, data);
    }),
  );

  // Get single variant by ID
  /**
   * @openapi
   * /api/v1/product-variants/{variantId}:
   *   get:
   *     summary: Get variant by id
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: variantId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Variant }
   */
  router.get(
    '/:variantId',
    validateId('variantId'),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.getById(req.params.variantId);
      return success(res, data);
    }),
  );

  // Update variant
  /**
   * @openapi
   * /api/v1/product-variants/{variantId}:
   *   put:
   *     summary: Update variant
   *     tags: [Products]
   *     security: [ { bearerAuth: [] as any[] } ]
   *     parameters:
   *       - in: path
   *         name: variantId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       200: { description: Updated }
   */
  router.put(
    '/:variantId',
    auth(),  // Allow any authenticated user
    validateId('variantId'),
    validate(require('./productVariant.validator').updateVariantSchema),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.update(
        req.params.variantId,
        req.body,
        req.user
      );
      return success(res, data, 'Variant updated');
    }),
  );

  // Delete variant (soft delete)
  /**
   * @openapi
   * /api/v1/product-variants/{variantId}:
   *   delete:
   *     summary: Delete variant
   *     tags: [Products]
   *     security: [ { bearerAuth: [] as any[] } ]
   *     parameters:
   *       - in: path
   *         name: variantId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Deleted }
   */
  router.delete(
    '/:variantId',
    auth(),  // Allow any authenticated user
    validateId('variantId'),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.remove(req.params.variantId, req.user);
      return success(res, data);
    }),
  );

  // Stock adjustment (admin only - keeping this restriction)
  /**
   * @openapi
   * /api/v1/product-variants/{variantId}/stock:
   *   put:
   *     summary: Adjust variant stock (Admin)
   *     tags: [Products]
   *     security: [ { bearerAuth: [] as any[] } ]
   *     parameters:
   *       - in: path
   *         name: variantId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               delta: { type: number }
   *               changeType: { type: string }
   *               referenceId: { type: string }
   *             required: [delta]
   *     responses:
   *       200: { description: Stock adjusted }
   */
  router.put(
    '/:variantId/stock',
    auth(['admin']),
    validateId('variantId'),
    validate(stockAdjustSchema),
    asyncHandler(async (req: ProductVariantsRequest, res: Response) => {
      const data = await service.adjustStock({
        variantId: req.params.variantId,
        delta: req.body.delta,
        changeType: req.body.changeType,
        referenceId: req.body.referenceId,
      });
      return success(res, data, 'Stock adjusted');
    }),
  );

  return router;
};

module.exports = { buildRouter };
