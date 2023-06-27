"use server";

import { sendEmail } from "mail";

export async function saveEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Welcome to our newsletter",
    templateId: "newsletterSignup",
  });
}
