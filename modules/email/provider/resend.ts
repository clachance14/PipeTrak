import { SendEmailHandler } from '@email/types';
import { config } from '../config';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Resend API key not found');
}

const { from } = config;

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

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
};
