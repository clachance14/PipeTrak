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
    html = "";
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
      subject = `Create an account for ${process.env.NEXTAUTH_URL}`;
      text = `Create an account for ${process.env.NEXTAUTH_URL} here: ${url}`;
      html = `<p>Create an account for <a href="${process.env.NEXTAUTH_URL}">${process.env.NEXTAUTH_URL}</a> here: <a href="${url}">${url}</a></p>`;
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
