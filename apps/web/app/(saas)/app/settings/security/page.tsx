import { getSession } from "@saas/auth/lib/server";
import { ActiveSessionsBlock } from "@saas/settings/components/ActiveSessionsBlock";
import { ChangePasswordForm } from "@saas/settings/components/ChangePassword";
import { PasskeysBlock } from "@saas/settings/components/PasskeysBlock";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.account.security.title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	return (
		<div className="grid grid-cols-1 gap-4">
			{/* <ConnectedAccountsBlock /> */}
			<ChangePasswordForm />
			<PasskeysBlock />
			<ActiveSessionsBlock />
		</div>
	);
}
