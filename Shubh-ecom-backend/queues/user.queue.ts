// @ts-nocheck
﻿const logger = require('../config/logger');
const { sendSMS } = require('../utils/sms');
const { sendEmail } = require('../utils/email');
const { generateOtp } = require('../utils/otp');
const { saveOtp } = require('../cache/otp.cache');
const emailNotification = require('../services/emailNotification.service');

/* =========================
   EMAIL VERIFICATION
========================= */
const sendEmailVerification = async (user) => {
  if (!user?.email) return;

  const otp = generateOtp();
  await saveOtp(user.email, otp);

  await emailNotification.send({
    templateName: 'auth_email_verification',
    to: user.email,
    variables: {
      firstName: user.firstName || 'User',
      otp,
      appName: process.env.APP_NAME || 'App',
    },
  });

  logger.info(`Email verification sent to ${user.email}`);
};

/* =========================
    OTP
========================= */
const sendSMSOtp = async ({ phone, otp: otpInput }) => {
  const phoneNumber = typeof phone === 'string' ? phone : phone?.phone;
  if (!phoneNumber) return;

  const otp = otpInput || generateOtp();
  await saveOtp(phoneNumber, otp);

  const message = `Your OTP is ${otp}. Valid for 5 minutes.`;

  try {
    await sendSMS(phoneNumber, message);
    logger.info(`SMS OTP sent to ${phoneNumber}`);
  } catch (err) {
    logger.error('SMS OTP failed', err);
    throw err;
  }
};

const sendEmailOtp = async ({ email, otp: otpInput }) => {
  if (!email) return;

  const otp = otpInput || generateOtp();
  await saveOtp(email, otp);

  try {
    await emailNotification.send({
      templateName: 'forgot_password_otp',
      to: email,
      variables: { otp, appName: process.env.APP_NAME || 'App' },
    });
  } catch (err) {
    if (String(err?.message || '').includes('Email template forgot_password_otp not found')) {
      logger.warn('forgot_password_otp template missing, falling back to direct email');
      await sendEmail({
        to: email,
        subject: `Your ${process.env.APP_NAME || 'App'} password reset OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2 style="margin-bottom: 8px;">Password Reset OTP</h2>
            <p>Use the OTP below to reset your password:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0; color: #2563eb;">
              ${otp}
            </div>
            <p>This OTP is valid for 10 minutes.</p>
          </div>
        `,
      });
    } else {
      throw err;
    }
  }

  logger.info(`Forgot-password OTP sent to ${email}`);
};

/* =========================
   USER ACTIVITY LOG
========================= */
const logUserActivity = async (userId, activity, meta = {}) => {
  logger.info('USER_ACTIVITY', {
    userId,
    activity,
    meta,
    at: new Date().toISOString(),
  });
};

module.exports = {
  sendEmailVerification,
  sendEmailOtp,
  sendSMSOtp,
  logUserActivity,
};
