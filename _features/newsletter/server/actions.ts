'use server';

import { sendEmail } from '@email/lib/send';

export async function saveEmail(email: string) {
  await sendEmail({
    to: email,
    subject: 'Welcome to our newsletter',
    text: 'Thank you for subscribing to our newsletter',
  });
}
