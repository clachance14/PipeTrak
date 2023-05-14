import { SendEmailHandler } from '@email/types';
import appConfig from '../../../config';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Resend API key not found');
}

const { nodemailer: mailConfig, from } = appConfig.email;

export const send: SendEmailHandler = async ({ to, subject, html, text }) => {
  const response = await fetch('https://api.resend.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      to,
      from,
      subject,
      html,
    }),
  });

  console.log(await response.json());
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
};
