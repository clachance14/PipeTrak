import nodemailer from "nodemailer";
import { config } from "../config";
import { SendEmailHandler } from "../types";

const { from } = config;

export const send: SendEmailHandler = async ({ to, subject, text, html }) => {
  const mailHost = process.env.MAIL_HOST;
  if (!mailHost) throw new Error('Please define env variable "MAIL_HOST"');
  const mailPort = process.env.MAIL_PORT;
  if (!mailPort) throw new Error('Please define env variable "MAIL_PORT"');
  const mailUser = process.env.MAIL_USER;
  if (!mailUser) throw new Error('Please define env variable "MAIL_USER"');
  const mailPass = process.env.MAIL_PASS;
  if (!mailPass) throw new Error('Please define env variable "MAIL_PASS"');

  // create the transporter
  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: Number(mailPort),
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  await transporter.sendMail({
    to,
    from,
    subject,
    text,
    html,
  });
};
