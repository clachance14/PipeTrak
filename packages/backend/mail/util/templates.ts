import { renderAsync } from "@react-email/render";
import { mailTemplates } from "../emails";

export async function getTemplate<
  TemplateId extends keyof typeof mailTemplates,
>({
  templateId,
  context,
  locale,
}: {
  templateId: TemplateId;
  context: Parameters<(typeof mailTemplates)[TemplateId]>[0];
  locale: keyof (typeof mailTemplates)[TemplateId]["subjects"];
}) {
  const template = mailTemplates[templateId];
  const email = mailTemplates[templateId](context as any);
  const subject =
    locale in template.subjects
      ? (template.subjects as any)[locale]
      : template.subjects["en"];
  const html = await renderAsync(email);
  const text = await renderAsync(email, { plainText: true });
  return { html, text, subject };
}
