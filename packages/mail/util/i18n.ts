import { type Locale, config } from "@config";
import type { MailMessages } from "i18n/types";
import { merge } from "lodash-es";
import type { TemplateId } from "./templates";

export async function getTranslations(locale: string) {
	return merge(
		(await import(`i18n/translations/mail/${config.i18n.defaultLocale}.json`))
			.default,
		(await import(`i18n/translations/mail/${locale}.json`)).default,
	) as MailMessages;
}

export async function getTranslatedSubject({
	locale,
	templateId,
}: { locale: Locale; templateId: TemplateId }) {
	const translations = await getTranslations(locale);
	return translations[templateId as keyof MailMessages]?.subject ?? "";
}
