const dotenv = require('dotenv');
const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate.model');

dotenv.config();

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
    '<p>Hello,</p><p>Your password reset OTP is <strong>{{otp}}</strong>. It expires in 10 minutes.</p><p>Regards,<br />{{appName}}</p>',
  order_invoice:
    '<p>Hello,</p><p>Your invoice <strong>{{invoiceNo}}</strong> is ready.</p><p>Regards,<br />{{appName}}</p>',
  credit_note:
    '<p>Hello,</p><p>Your credit note <strong>{{creditNoteNo}}</strong> is ready.</p><p>Regards,<br />{{appName}}</p>',
};

async function connectMongo() {
  const uri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
  if (!uri) {
    throw new Error('Missing MONGO_URI or MONGO_REPLICA_URI in environment');
  }
  await mongoose.connect(uri);
}

async function run() {
  try {
    await connectMongo();
    const existing = await EmailTemplate.find(
      { name: { $in: REQUIRED_EMAIL_TEMPLATES } },
      { name: 1 },
    ).lean();
    const existingNames = new Set((existing || []).map((t) => t.name));

    const created = [];
    for (const name of REQUIRED_EMAIL_TEMPLATES) {
      if (existingNames.has(name)) continue;

      await EmailTemplate.create({
        name,
        subject: DEFAULT_TEMPLATE_SUBJECTS[name],
        bodyHtml: DEFAULT_TEMPLATE_BODIES[name],
        variables: {},
      });
      created.push(name);
    }

    const finalTemplates = await EmailTemplate.find(
      { name: { $in: REQUIRED_EMAIL_TEMPLATES } },
      { name: 1 },
    ).lean();
    const finalSet = new Set((finalTemplates || []).map((t) => t.name));
    const missing = REQUIRED_EMAIL_TEMPLATES.filter((name) => !finalSet.has(name));

    console.log('Email template seed completed');
    console.log(`Created: ${created.join(', ') || 'none'}`);
    console.log(
      `Skipped: ${REQUIRED_EMAIL_TEMPLATES.filter((name) => !created.includes(name)).join(', ') || 'none'}`,
    );
    console.log(`Ready: ${missing.length === 0 ? 'yes' : 'no'}`);
    if (missing.length > 0) {
      console.log(`Missing: ${missing.join(', ')}`);
    }
  } catch (err) {
    console.error('Email template seed failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
