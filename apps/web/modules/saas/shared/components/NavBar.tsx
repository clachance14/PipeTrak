"use client";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useOrganization } from "@saas/organizations/hooks/use-organization";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import {
	ChevronRightIcon,
	HomeIcon,
	SettingsIcon,
	UserCogIcon,
	Wand2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization } = useOrganization();

	const { useSidebarLayout } = config.ui.saas;

	const menuItems = [
		{
			label: t("app.menu.start"),
			href: "/app",
			icon: HomeIcon,
			isActive: pathname === "/app",
		},
		{
			label: t("app.menu.aiDemo"),
			href: "/app/ai-demo",
			icon: Wand2Icon,
			isActive: pathname.startsWith("/app/ai-demo"),
		},
		...(activeOrganization
			? [
					{
						label: t("app.menu.organizationSettings"),
						href: "/app/organization-settings",
						icon: SettingsIcon,
						isActive: pathname.startsWith("/app/organization-settings"),
					},
				]
			: [
					{
						label: t("app.menu.accountSettings"),
						href: "/app/settings",
						icon: SettingsIcon,
						isActive: pathname.startsWith("/app/settings"),
					},
				]),
		...(user?.role === "admin"
			? [
					{
						label: t("app.menu.admin"),
						href: "/app/admin",
						icon: UserCogIcon,
						isActive: pathname.startsWith("/app/admin"),
					},
				]
			: []),
	];

	return (
		<nav
			className={cn("w-full", {
				"w-full md:fixed md:top-0 md:left-0 md:h-full md:w-[250px]":
					useSidebarLayout,
			})}
		>
			<div
				className={cn("container max-w-6xl py-4", {
					"container max-w-6xl py-4 md:flex md:h-full md:flex-col md:px-4 md:pt-4 md:pb-0":
						useSidebarLayout,
				})}
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div
						className={cn("flex items-center gap-2", {
							"md:flex md:w-full md:flex-col md:items-stretch md:align-stretch":
								useSidebarLayout,
						})}
					>
						<Link href="/app" className="block">
							<Logo />
						</Link>

						{config.organizations.enable && (
							<>
								<span
									className={cn("hidden opacity-30 md:block", {
										"md:hidden": useSidebarLayout,
									})}
								>
									<ChevronRightIcon className="size-4" />
								</span>

								<OrganzationSelect
									className={cn({ "md:mt-2 md:w-full": useSidebarLayout })}
								/>
							</>
						)}
					</div>

					<div
						className={cn("mr-0 ml-auto flex items-center justify-end gap-4", {
							"md:hidden": useSidebarLayout,
						})}
					>
						<UserMenu />
					</div>
				</div>

				<ul
					className={cn(
						"no-scrollbar -mx-4 -mb-4 mt-6 flex list-none items-center justify-start gap-4 overflow-x-auto px-4 text-sm",
						{
							"md:my-4 md:flex md:flex-col md:items-stretch md:gap-1":
								useSidebarLayout,
						},
					)}
				>
					{menuItems.map((menuItem) => (
						<li key={menuItem.href}>
							<Link
								href={menuItem.href}
								className={cn(
									"flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-1",
									[
										menuItem.isActive
											? "border-primary font-bold"
											: "border-transparent",
									],
									{
										"md:-mx-4 md:border-b-0 md:border-l-2 md:px-4 md:py-2":
											useSidebarLayout,
									},
								)}
							>
								<menuItem.icon
									className={`size-4 shrink-0 md:size-5 ${
										menuItem.isActive ? "text-primary" : "opacity-50"
									}`}
								/>
								<span>{menuItem.label}</span>
							</Link>
						</li>
					))}
				</ul>

				<div
					className={cn("-mx-4 mt-auto mb-0 hidden p-4", {
						"md:block": useSidebarLayout,
					})}
				>
					<UserMenu showUserName />
				</div>
			</div>
		</nav>
	);
}
