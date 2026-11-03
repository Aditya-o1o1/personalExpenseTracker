const nodemailer = require('nodemailer');
const { createError } = require('./error.utils');

const createEmailTransporter = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw createError('Email delivery is not configured', 500);
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const sendEmail = async (transporter, email, subject, text) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
  });
};

module.exports = { createEmailTransporter, sendEmail };
