// @ts-nocheck
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

const resolveSenderAddress = () => {
  if (env.SMTP_FROM) return env.SMTP_FROM;
  if (env.SMTP_ALLOW_USER_AS_FROM && env.SMTP_USER) {
    return env.SMTP_USER;
  }
  return null;
};

const classifySmtpError = (err) => {
  const code = String(err?.code || '').toUpperCase();
  const responseCode = Number(err?.responseCode || 0);
  const message = String(err?.message || '').toLowerCase();

  if (
    code.includes('EAUTH') ||
    responseCode === 535 ||
    message.includes('invalid login') ||
    message.includes('authentication')
  ) {
    return 'auth_failure';
  }

  if (
    code.includes('ECONNECTION') ||
    code.includes('ETIMEDOUT') ||
    code.includes('ESOCKET') ||
    responseCode === 421 ||
    message.includes('timeout') ||
    message.includes('connect')
  ) {
    return 'connection_timeout';
  }

  return 'unknown';
};

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure:
    typeof env.SMTP_SECURE === 'boolean'
      ? env.SMTP_SECURE
      : Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const verifySmtpConnection = async () => {
  try {
    await transporter.verify();
    logger.info('smtp_ready', {
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure:
        typeof env.SMTP_SECURE === 'boolean'
          ? env.SMTP_SECURE
          : Number(env.SMTP_PORT) === 465,
    });
    return true;
  } catch (err) {
    const category = classifySmtpError(err);
    logger.error('smtp_not_ready', {
      category,
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      error: err?.message,
      code: err?.code,
      responseCode: err?.responseCode,
    });
    return false;
  }
};

const sendEmail = async ({ to, subject, html }) => {
  const fromAddress = resolveSenderAddress();
  if (!fromAddress) {
    const senderError = new Error(
      'SMTP sender address is not configured. Set SMTP_FROM or allow SMTP_USER fallback.',
    );
    logger.error('smtp_sender_missing', {
      hasSmtpFrom: Boolean(env.SMTP_FROM),
      hasSmtpUser: Boolean(env.SMTP_USER),
      allowUserFallback: Boolean(env.SMTP_ALLOW_USER_AS_FROM),
    });
    throw senderError;
  }

  try {
    await transporter.sendMail({
      from: `"${env.APP_NAME}" <${fromAddress}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    const category = classifySmtpError(err);
    logger.error('email_send_failed', {
      category,
      to,
      subject,
      error: err?.message,
      code: err?.code,
      responseCode: err?.responseCode,
    });
    throw err;
  }
};

module.exports = { sendEmail, verifySmtpConnection };