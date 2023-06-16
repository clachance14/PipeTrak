import { sendEmail } from "mail";
import { SendVerificationRequestParams } from "next-auth/providers";

// a custom handler to send the verification emails
export const sendVerificationMail = async ({
  identifier: email,
  url,
  provider,
}: SendVerificationRequestParams) => {
  let subject = "",
    text = "",
    html = "",
    templateId;
  const context: Record<string, unknown> = {};

  switch (provider.id) {
    case "forgot-password":
      templateId = "reset-password";
      context.resetUrl = url;
      subject = `Reset your password`;
      break;
    case "change-email":
      templateId = "change-email";
      context.confirmationUrl = url;
      subject = `Confirm your new email`;
      break;
    case "create-account":
      subject = `Create an account for ${process.env.NEXTAUTH_URL}`;
      text = `Create an account for ${process.env.NEXTAUTH_URL} here: ${url}`;
      html = `<p>Create an account for <a href="${process.env.NEXTAUTH_URL}">${process.env.NEXTAUTH_URL}</a> here: <a href="${url}">${url}</a></p>`;
      break;
    default:
      templateId = "magic-link";
      context.magicLink = url;
      subject = `Magic link`;
      break;
  }

  const sent = await sendEmail({
    to: email,
    subject,
    text,
    html,
    templateId,
    context,
  });

  if (!sent) {
    throw new Error("Verification email not sent");
  }
};
