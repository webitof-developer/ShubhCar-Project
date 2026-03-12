// @ts-nocheck
// backend/services/emailNotification.service.js
const EmailTemplate = require('../models/EmailTemplate.model');
const { sendEmail } = require('../utils/email');
const { error } = require('../utils/apiResponse');
const logger = require('../config/logger');

class EmailNotificationService {
  async send({ templateName, to, variables = {} }) {
    const template = await EmailTemplate.findOne({ name: templateName }).lean();
    if (!template) {
      logger.error('email_template_missing', {
        templateName,
        to,
      });
      error(`Email template ${templateName} not found (email send skipped/failed)`, 404);
    }

    let html = template.bodyHtml;
    let subject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, value ?? '');
      subject = subject.replaceAll(`{{${key}}}`, value ?? '');
    });

    try {
      await sendEmail({ to, subject, html });
    } catch (err) {
      logger.error('email_notification_send_failed', {
        templateName,
        to,
        error: err?.message,
      });
      throw err;
    }
    return true;
  }
}

module.exports = new EmailNotificationService();

