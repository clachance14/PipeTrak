import { renderAsync } from "@react-email/render";
import { emails } from "../emails";

export async function getTemplate<Template extends keyof typeof emails>(
  templateId: Template,
  context: Parameters<typeof emails[Template]>[0],
) {
  const email = await emails[templateId](context);
  const html = await renderAsync(email);
  const text = await renderAsync(email, { plainText: true });
  return { html, text };
}
