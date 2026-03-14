// @ts-nocheck
const logger = require('../config/logger');
const EmailTemplate = require('../models/EmailTemplate.model');

const REQUIRED_EMAIL_TEMPLATES = [
  'auth_email_verification',
  'forgot_password_otp',
  'order_invoice',
  'credit_note',
];

const DEFAULT_TEMPLATE_SUBJECTS = {
  auth_email_verification: 'Verify your email',
  forgot_password_otp: 'Your password reset OTP',
  order_invoice: 'Your order invoice',
  credit_note: 'Your credit note',
};

const DEFAULT_TEMPLATE_BODIES = {
  auth_email_verification:
    '<p>Hello {{firstName}},</p><p>Your verification OTP is <strong>{{otp}}</strong>.</p><p>Regards,<br />{{appName}}</p>',
  forgot_password_otp:
    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;"><h2 style="margin-bottom: 8px;">Password Reset OTP</h2><p>Use the OTP below to reset your password:</p><div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0; color: #2563eb;">{{otp}}</div><p>This OTP is valid for 10 minutes.</p></div>',
  order_invoice:
    '<p>Hello,</p><p>Your invoice <strong>{{invoiceNo}}</strong> is ready.</p><p>Regards,<br />{{appName}}</p>',
  credit_note:
    '<p>Hello,</p><p>Your credit note <strong>{{creditNoteNo}}</strong> is ready.</p><p>Regards,<br />{{appName}}</p>',
};

const getMissingEmailTemplates = async () => {
  const templates = await EmailTemplate.find(
    { name: { $in: REQUIRED_EMAIL_TEMPLATES } },
    { name: 1 },
  ).lean();

  const existing = new Set((templates || []).map((t) => t?.name).filter(Boolean));
  return REQUIRED_EMAIL_TEMPLATES.filter((name) => !existing.has(name));
};

const checkRequiredEmailTemplates = async (options = {}) => {
  const silent = Boolean(options?.silent);
  try {
    const missing = await getMissingEmailTemplates();

    if (missing.length === 0) {
      if (!silent) {
        logger.info('email_templates_ready', {
          requiredCount: REQUIRED_EMAIL_TEMPLATES.length,
        });
      }
      return { ready: true, missing: [] };
    }

    if (!silent) {
      logger.warn('email_templates_missing', {
        missing,
        message:
          'Email template(s) missing. Email send may fail for flows depending on these templates.',
      });
    }
    return { ready: false, missing };
  } catch (err) {
    if (!silent) {
      logger.error('email_templates_check_failed', {
        error: err?.message,
      });
    }
    return { ready: false, missing: REQUIRED_EMAIL_TEMPLATES.slice() };
  }
};

const seedMissingEmailTemplates = async () => {
  const missing = await getMissingEmailTemplates();
  if (missing.length === 0) {
    return { created: [], skipped: REQUIRED_EMAIL_TEMPLATES.slice() };
  }

  const created = [];
  for (const name of missing) {
    await EmailTemplate.updateOne(
      { name },
      {
        $setOnInsert: {
          name,
          subject: DEFAULT_TEMPLATE_SUBJECTS[name],
          bodyHtml: DEFAULT_TEMPLATE_BODIES[name],
          variables: {},
        },
      },
      { upsert: true },
    );
    created.push(name);
  }

  return {
    created,
    skipped: REQUIRED_EMAIL_TEMPLATES.filter((name) => !created.includes(name)),
  };
};

module.exports = {
  REQUIRED_EMAIL_TEMPLATES,
  checkRequiredEmailTemplates,
  seedMissingEmailTemplates,
};
