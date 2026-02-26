const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { vendorLimiter, adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const controller = require('./vendors.controller');
const ROLES = require('../../constants/roles');
const {
  onboardVendorSchema,
  vendorSelfUpdateSchema,
  adminUpdateVendorSchema,
  updateBankSchema,
  statusUpdateSchema,
  addDocumentsSchema,
} = require('./vendor.validator');

const router = express.Router();

// Vendor self
/**
 * @openapi
 * /api/v1/vendors/me:
 *   get:
 *     summary: Get vendor profile (self)
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Vendor profile }
 */
router.get('/me', auth(), controller.getMine);
/**
 * @openapi
 * /api/v1/vendors/me/documents:
 *   post:
 *     summary: Upload vendor documents
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Documents uploaded }
 */
router.post('/me/documents', vendorLimiter, auth(), validate(addDocumentsSchema), controller.addDocuments);

/**
 * @openapi
 * /api/v1/vendors/me:
 *   put:
 *     summary: Update vendor profile (self)
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 */
router.put('/me', vendorLimiter, auth(), validate(vendorSelfUpdateSchema), controller.updateDetails);

/**
 * @openapi
 * /api/v1/vendors/me/bank:
 *   put:
 *     summary: Update vendor bank details
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 */
router.put('/me/bank', vendorLimiter, auth(), validate(updateBankSchema), controller.updateBank);

// Admin onboarding & status
/**
 * @openapi
 * /api/v1/vendors/admin/onboard:
 *   post:
 *     summary: Onboard a new vendor (Admin)
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Vendor onboarded }
 */
router.post('/admin/onboard', adminLimiter, auth([ROLES.ADMIN]), validate(onboardVendorSchema), controller.onboard);

/**
 * @openapi
 * /api/v1/vendors/admin/{vendorId}/status:
 *   patch:
 *     summary: Update vendor status (Admin)
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/admin/:vendorId/status', adminLimiter, auth([ROLES.ADMIN]), validateId('vendorId'), validate(statusUpdateSchema), controller.updateStatus);

/**
 * @openapi
 * /api/v1/vendors/admin/{vendorId}:
 *   patch:
 *     summary: Update vendor details (Admin)
 *     tags: [Vendors]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/admin/:vendorId', adminLimiter, auth([ROLES.ADMIN]), validateId('vendorId'), validate(adminUpdateVendorSchema), controller.updateDetailsAdmin);

module.exports = router;

