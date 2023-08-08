"use server";

import { sendEmail } from "@supastarter/backend/mail";

export async function saveEmail(email: string) {
  await sendEmail({
    to: email,
    templateId: "newsletterSignup",
  });
}
