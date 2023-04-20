import { SendEmailHandler } from '@email/types';
import appConfig from '../../../config';

const plunkApiKey = process.env.PLUNK_API_KEY;

if (!plunkApiKey) {
  throw new Error('Plunk API key not found');
}

const { nodemailer: mailConfig, from } = appConfig.email;

export const send: SendEmailHandler = async ({ to, subject, html, text }) => {
  await fetch('https://api.useplunk.com/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${plunkApiKey}`,
    },
    body: JSON.stringify({
      to,
      from,
      subject,
      body: html,
    }),
  });
};
