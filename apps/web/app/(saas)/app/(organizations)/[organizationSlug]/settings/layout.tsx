import { config } from "@repo/config";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { OrganizationAvatar } from "@saas/organizations/components/OrganizationAvatar";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { CreditCardIcon, Settings2Icon, Users2Icon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	try {
		const organization = await getActiveOrganization();

		if (!organization) {
			redirect("/app");
		}

		const organizationSettingsBasePath = "/app/organization-settings";

		const menuItems = [
			{
				title: t("settings.menu.organization.title"),
				avatar: (
					<OrganizationAvatar
						name={organization.name}
						avatarUrl={organization.logo}
					/>
				),
				items: [
					{
						title: t("settings.menu.organization.general"),
						href: `${organizationSettingsBasePath}/general`,
						icon: <Settings2Icon className="size-4 text-primary" />,
					},
					{
						title: t("settings.menu.organization.members"),
						href: `${organizationSettingsBasePath}/members`,
						icon: <Users2Icon className="size-4 text-primary" />,
					},
					...(config.organizations.enableBilling
						? [
								{
									title: t("settings.menu.organization.billing"),
									href: `${organizationSettingsBasePath}/billing`,
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
	} catch {
		redirect("/app");
	}
}
