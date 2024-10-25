import { config } from "@repo/config";
import { SignupForm } from "@saas/auth/components/SignupForm";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.signup.title"),
	};
}

export default async function SignupPage() {
	if (!config.auth.enableSignup) {
		return redirect("/auth/login");
	}

	return <SignupForm />;
}
