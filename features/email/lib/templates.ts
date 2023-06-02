import { readFileSync } from 'fs';
import mjml2html from 'mjml';
import { join } from 'path';

export async function parseMjmlTemplate(templateId: string) {
  // get file content from url
  const file = join(process.cwd(), 'public', 'mail-templates', `${templateId}.mjml`);
  const fileContent = readFileSync(file, 'utf8');

  // parse file content with mjml and return the html
  const { html, errors } = mjml2html(fileContent);

  if (errors.length) {
    console.error(errors);
    return null;
  }

  return html;
}
