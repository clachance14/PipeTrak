import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { Logo } from "@shared/components/Logo";
import { Building2, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
export default async function AdminLayout({ children }) {
    const t = await getTranslations();
    const session = await getSession();
    if (!session) {
        redirect("/auth/login");
    }
    if (session.user?.role !== "admin") {
        redirect("/app");
    }
    return (<>
			<PageHeader title={t("admin.title")} subtitle={t("admin.description")}/>
			<SidebarContentLayout sidebar={<SettingsMenu menuItems={[
                {
                    avatar: (<Logo className="size-8" withLabel={false}/>),
                    title: t("admin.title"),
                    items: [
                        {
                            title: t("admin.menu.users"),
                            href: "/app/admin/users",
                            icon: (<Users className="size-4 opacity-50"/>),
                        },
                        ...(config.organizations.enable
                            ? [
                                {
                                    title: t("admin.menu.organizations"),
                                    href: "/app/admin/organizations",
                                    icon: (<Building2 className="size-4 opacity-50"/>),
                                },
                            ]
                            : []),
                    ],
                },
            ]}/>}>
				{children}
			</SidebarContentLayout>
		</>);
}
