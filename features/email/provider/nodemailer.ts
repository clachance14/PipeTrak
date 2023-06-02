import { SendEmailHandler } from '@email/types';
import nodemailer from 'nodemailer';
import { config } from '../config';

const { nodemailer: mailConfig, from } = config;

// create the transporter
const transporter = nodemailer.createTransport({
  ...mailConfig,
});

export const send: SendEmailHandler = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    to,
    from,
    subject,
    text,
    html,
  });
};
