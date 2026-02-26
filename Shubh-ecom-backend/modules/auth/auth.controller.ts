
import type { Response } from 'express';
import type { AuthRequest } from './auth.types';
const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');
const { success } = require('../../utils/apiResponse');
const {
  setAccessTokenCookie,
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
} = require('../../utils/cookieTokens');

exports.register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body);
  if (result?.token) {
    setAccessTokenCookie(res, result.token);
  }
  return success(res, result, 'Registration successful');
});

exports.login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);
  setAuthCookies(res, {
    accessToken: result?.accessToken,
    refreshToken: result?.refreshToken,
  });
  return success(res, result, 'Login successful');
});

exports.sendPhoneOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.sendPhoneOtp(req.body.phone);
  return success(res, null, 'OTP sent successfully');
});

exports.verifyPhoneOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.verifyPhoneOtp(req.body, {
    ip: req.ip,
    device: req.headers['user-agent'],
  });
  setAuthCookies(res, {
    accessToken: result?.accessToken,
    refreshToken: result?.refreshToken,
  });
  return success(res, result, 'OTP verified successfully');
});

exports.sendEmailOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.sendEmailOtp(req.body.email);
  return success(res, null, 'OTP sent successfully');
});

exports.verifyEmailOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.verifyEmailOtp(req.body, {
    ip: req.ip,
    device: req.headers['user-agent'],
  });
  setAuthCookies(res, {
    accessToken: result?.accessToken,
    refreshToken: result?.refreshToken,
  });
  return success(res, result, 'OTP verified successfully');
});

exports.googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.googleAuth(req.body.idToken, {
    ip: req.ip,
    device: req.headers['user-agent'],
  });
  setAuthCookies(res, {
    accessToken: result?.accessToken,
    refreshToken: result?.refreshToken,
  });
  return success(res, result, 'Login successful');
});

exports.refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const result = await authService.refresh({ refreshToken });
  setAuthCookies(res, {
    accessToken: result?.accessToken,
    refreshToken: result?.refreshToken,
  });
  return success(res, result, 'Token refreshed');
});
exports.logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  await authService.logout({
    userId: req.user.id,
    refreshToken,
  });
  clearAuthCookies(res);
  return success(res, null, 'Logout successful');
});

exports.logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logoutAll(req.user.userId);
  clearAuthCookies(res);
  return success(res, null, 'All sessions logged out');
});

exports.forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.forgotPassword(req.body);
  return success(res, null, 'If account exists, OTP has been sent');
});

exports.resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.resetPassword(req.body);
  return success(res, null, 'Password reset successful');
});
