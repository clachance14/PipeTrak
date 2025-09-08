import { ContactForm } from "@marketing/home/components/ContactForm";
import { config } from "@repo/config";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations();
	return {
		title: t("contact.title"),
	};
}

export default async function ContactPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Enable static rendering
	setRequestLocale(locale);
	if (!config.contactForm.enabled) {
		redirect("/");
	}

	const t = await getTranslations();
	return (
		<div className="container max-w-xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center">
				<h1 className="mb-2 font-bold text-5xl">
					{t("contact.title")}
				</h1>
				<p className="text-balance text-lg opacity-50">
					{t("contact.description")}
				</p>
			</div>

			<ContactForm />
		</div>
	);
}
