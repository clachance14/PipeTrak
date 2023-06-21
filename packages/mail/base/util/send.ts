import { emails } from "../emails";
import { send } from "./provider";
import { getTemplate } from "./templates";

export async function sendEmail(params: {
  to: string;
  subject: string;
  templateId: keyof typeof emails;
  context?: Parameters<(typeof emails)[keyof typeof emails]>[0];
}) {
  const { to, subject, templateId, context } = params;

  const { html, text } = await getTemplate(templateId, context);

  try {
    // send the email
    await send({
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
