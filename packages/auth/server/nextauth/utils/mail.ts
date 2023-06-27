import { sendEmail } from "mail";
import { SendVerificationRequestParams } from "next-auth/providers";

// a custom handler to send the verification emails
export const sendVerificationMail = async ({
  identifier: email,
  url,
  provider,
}: SendVerificationRequestParams & { name?: string }) => {
  let sent = false;

  switch (provider.id) {
    case "forgot-password":
      sent = await sendEmail({
        to: email,
        subject: "Reset your password",
        templateId: "magicLink",
        context: { url },
      });
      break;
    case "change-email":
      sent = await sendEmail({
        to: email,
        subject: "Confirm your new email",
        templateId: "magicLink",
        context: { url },
      });
      break;
    case "create-account":
      sent = await sendEmail({
        to: email,
        subject: "Welcome to supastarter",
        templateId: "newUser",
        context: { url },
      });
      break;
    default:
      sent = await sendEmail({
        to: email,
        subject: "Magic link",
        templateId: "magicLink",
        context: { url },
      });
      break;
  }

  if (!sent) {
    throw new Error("Verification email not sent");
  }
};
