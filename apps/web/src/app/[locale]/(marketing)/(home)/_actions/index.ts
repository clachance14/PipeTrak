"use server";

import { sendEmail } from "../../../../../../../packages/mail";

export async function saveEmail(email: string) {
  await sendEmail({
    to: email,
    templateId: "newsletterSignup",
  });
}
