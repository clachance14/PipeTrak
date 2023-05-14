import { send } from '@email/provider/nodemailer';
import { parseMjmlTemplate } from './templates';

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  templateId?: string;
  context?: Record<string, unknown>;
}) {
  const { to, subject, text, context, templateId } = params;
  let { html } = params;

  // check if a template id is provided
  if (templateId) {
    // if so, we use the template id to get the mjml template
    const template = await parseMjmlTemplate(templateId);
    html = template ?? html;
  }

  // replace the placeholders in the html with the context
  if (context) {
    Object.keys(context).forEach((key) => {
      html = html?.replaceAll(`{{${key}}}`, context[key] as string);
    });
  }

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
