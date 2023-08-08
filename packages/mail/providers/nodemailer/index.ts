import nodemailer from "nodemailer";
import { config } from "../../config";
import { SendEmailHandler } from "../../types";
import { env } from "./env.mjs";

const { from } = config;

export const send: SendEmailHandler = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    auth: {
      user: env.MAIL_USER,
      pass: env.MAIL_PASS,
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
