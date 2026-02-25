import type { SeoRequestShape } from './seo.types';
import type { Response } from 'express';
import type { SeoRequest } from './seo.types';
const asyncHandler = require('../../utils/asyncHandler');
const seoService = require('./seo.service');
const { success } = require('../../utils/apiResponse');

/* =======================
   ADMIN CMS
======================= */

exports.upsert = asyncHandler(async (req: SeoRequest, res: Response) => {
  const data = await seoService.upsertSeo(req.body, req.user);
  return success(res, data, 'SEO saved');
});

exports.list = asyncHandler(async (req: SeoRequest, res: Response) => {
  const data = await seoService.listSeo(req.query);
  return success(res, data, 'SEO records fetched');
});

exports.deactivate = asyncHandler(async (req: SeoRequest, res: Response) => {
  const data = await seoService.deactivateSeo(req.params.id, req.user);
  return success(res, data, 'SEO deactivated');
});

/* =======================
   PUBLIC / INTERNAL
======================= */

exports.resolve = asyncHandler(async (req: SeoRequest, res: Response) => {
  const data = await seoService.resolveSeo(req.query);
  return success(res, data);
});
