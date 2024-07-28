import type { Locale } from "@config";
import { renderAsync } from "@react-email/render";
import { EmailChange } from "../emails/EmailChange";
import { ForgotPassword } from "../emails/ForgotPassword";
import { MagicLink } from "../emails/MagicLink";
import { NewUser } from "../emails/NewUser";
import { NewsletterSignup } from "../emails/NewsletterSignup";
import { TeamInvitation } from "../emails/TeamInvitation";
import { getTranslations } from "./i18n";

export const mailTemplates = {
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	newsletterSignup: NewsletterSignup,
	teamInvitation: TeamInvitation,
	emailChange: EmailChange,
};

export async function getTemplate<T extends TemplateId>({
	templateId,
	context,
	locale,
}: {
	templateId: T;
	context: Omit<
		Parameters<(typeof mailTemplates)[T]>[0],
		"locale" | "translations"
	>;
	locale: Locale;
}) {
	const template = mailTemplates[templateId];
	const translations = await getTranslations(locale);

	const email = template({
		...(context as any),
		locale,
		translations,
	});

	const html = await renderAsync(email);
	const text = await renderAsync(email, { plainText: true });
	return { html, text };
}

export type TemplateId = keyof typeof mailTemplates;
