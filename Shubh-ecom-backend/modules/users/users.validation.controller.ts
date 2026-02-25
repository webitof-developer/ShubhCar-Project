import type { UsersRequestShape } from './users.types';
import type { Response } from 'express';
import type { UsersRequest } from './users.types';
const usersService = require('./users.service');
const userRepo = require('./user.repo');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Lightweight duplicate check for real-time form validation
 */
const checkEmailAvailability = asyncHandler(async (req: UsersRequest, res: Response) => {
  const { email, excludeUserId } = req.query;

  if (!email) {
    return res.success({ available: true });
  }

// @ts-ignore
  const existing = await userRepo.findByEmail(email.toLowerCase().trim());

  // If editing, exclude current user from check
  if (existing && excludeUserId && existing._id.toString() === excludeUserId) {
    return res.success({ available: true });
  }

  return res.success({ available: !existing });
});

/**
 * Lightweight duplicate check for phone
 */
const checkPhoneAvailability = asyncHandler(async (req: UsersRequest, res: Response) => {
  const { phone, excludeUserId } = req.query;

  if (!phone) {
    return res.success({ available: true });
  }

// @ts-ignore
  const existing = await userRepo.findByPhone(phone.trim());

  // If editing, exclude current user from check
  if (existing && excludeUserId && existing._id.toString() === excludeUserId) {
    return res.success({ available: true });
  }

  return res.success({ available: !existing });
});

module.exports = {
  checkEmailAvailability,
  checkPhoneAvailability,
};
