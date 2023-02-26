import nodemailer from 'nodemailer';
import { parseMjmlTemplate } from './templates';

// we initialize the nodemailer config onceso we can use it in the callbacks
/* 
  TODO: move this to a config file 
*/
export const mailConfig = {
  server: {
    host: process.env.MAIL_HOST as string,
    port: Number(process.env.MAIL_PORT),
    auth: {
      user: process.env.MAIL_USER as string,
      pass: process.env.MAIL_PASSWORD as string,
    },
  },
  from: 'kontakt@sedecon.tech',
};

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

  // create the transporter
  const transporter = nodemailer.createTransport({
    ...mailConfig.server,
  });

  try {
    // send the email
    await transporter.sendMail({
      to,
      from: mailConfig.from,
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
