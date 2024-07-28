import { config } from "@config";
import { logger } from "logs";
import { getProvider } from "../provider";
import { getTranslatedSubject } from "./i18n";
import type { TemplateId, mailTemplates } from "./templates";
import { getTemplate } from "./templates";

export async function sendEmail<T extends TemplateId>(params: {
	to: string;
	templateId: T;
	context: Omit<
		Parameters<(typeof mailTemplates)[T]>[0],
		"locale" | "translations"
	>;
	locale?: keyof typeof config.i18n.locales;
}) {
	const {
		to,
		templateId,
		context,
		locale = config.i18n.defaultLocale,
	} = params;

	const { send } = await getProvider();

	const { html, text } = await getTemplate({
		templateId,
		context,
		locale,
	});

	const subject = await getTranslatedSubject({ locale, templateId });

	try {
		await send({
			to,
			subject,
			text,
			html,
		});
		return true;
	} catch (e) {
		logger.error(e);
		return false;
	}
}
