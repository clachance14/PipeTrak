import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { UserAvatar } from "@shared/components/UserAvatar";
import { CreditCardIcon, LockKeyholeIcon, SettingsIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
export default async function SettingsLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const menuItems = [
		{
			title: t("settings.menu.account.title"),
			avatar: (
				<UserAvatar
					name={session.user.name ?? ""}
					avatarUrl={session.user.image}
				/>
			),
			items: [
				{
					title: t("settings.menu.account.general"),
					href: "/app/settings/general",
					icon: <SettingsIcon className="size-4 text-primary" />,
				},
				{
					title: t("settings.menu.account.security"),
					href: "/app/settings/security",
					icon: <LockKeyholeIcon className="size-4 text-primary" />,
				},
				...(config.users.enableBilling
					? [
							{
								title: t("settings.menu.account.billing"),
								href: "/app/settings/billing",
								icon: <CreditCardIcon className="size-4 text-primary" />,
							},
						]
					: []),
			],
		},
	];

	return (
		<SidebarContentLayout sidebar={<SettingsMenu menuItems={menuItems} />}>
			{children}
		</SidebarContentLayout>
	);
}
