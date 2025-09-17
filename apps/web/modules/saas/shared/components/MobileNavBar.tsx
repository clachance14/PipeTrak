"use client";

import { useState } from "react";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { Logo } from "@shared/components/Logo";
import { Button } from "@ui/components/button";
import { Sheet, SheetContent, SheetTrigger } from "@ui/components/sheet";
import { cn } from "@ui/lib";
import {
	BotMessageSquareIcon,
	Home,
	Menu,
	Settings,
	UserCog2Icon,
	UserCogIcon,
	X,
	Factory,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";

export function MobileNavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();

	const canAccessAiChatbot =
		user?.email?.toLowerCase() === "clachance14@hotmail.com";
	const [isOpen, setIsOpen] = useState(false);

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	// Primary navigation items (always visible)
	const primaryItems = [
		{
			label: "PipeTrak",
			href: "/app/pipetrak",
			icon: Factory,
			isActive: pathname.includes("/pipetrak"),
		},
	];

	// Secondary items for hamburger menu
	const secondaryItems = [
		{
			label: t("app.menu.start"),
			href: basePath,
			icon: Home,
			isActive: pathname === basePath,
		},
		...(canAccessAiChatbot
			? [
					{
						label: t("app.menu.aiChatbot"),
						href: activeOrganization
							? `/app/${activeOrganization.slug}/chatbot`
							: "/app/chatbot",
						icon: BotMessageSquareIcon,
						isActive: pathname.includes("/chatbot"),
					},
				]
			: []),
		...(activeOrganization &&
			!config.organizations.hideOrganization &&
			isOrganizationAdmin
			? [
					{
						label: t("app.menu.organizationSettings"),
						href: `${basePath}/settings`,
						icon: Settings,
						isActive: pathname.startsWith(`${basePath}/settings/`),
					},
				]
			: []),
		{
			label: t("app.menu.accountSettings"),
			href: "/app/settings",
			icon: UserCog2Icon,
			isActive: pathname.startsWith("/app/settings/"),
		},
		...(user?.role === "admin"
			? [
					{
						label: t("app.menu.admin"),
						href: "/app/admin",
						icon: UserCogIcon,
						isActive: pathname.startsWith("/app/admin/"),
					},
				]
			: []),
	];

	return (
		<nav className="w-full bg-background/95 backdrop-blur-sm border-b lg:hidden">
			<div className="container px-4 py-3">
				<div className="flex items-center justify-between">
					{/* Left side: Logo and PipeTrak */}
					<div className="flex items-center gap-3">
						<Link href="/app" className="block">
							<Logo className="h-8 w-auto" />
						</Link>

						{/* Primary nav items */}
						<div className="flex items-center gap-2">
							{primaryItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
										item.isActive
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<item.icon className="h-4 w-4" />
									<span className="hidden sm:inline">
										{item.label}
									</span>
								</Link>
							))}
						</div>
					</div>

					{/* Right side: Organization selector and menu */}
					<div className="flex items-center gap-2">
						{config.organizations.enable &&
							!config.organizations.hideOrganization && (
								<div className="hidden sm:block">
									<OrganzationSelect className="h-8" />
								</div>
							)}

						{/* Hamburger menu */}
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9"
								>
									{isOpen ? (
										<X className="h-5 w-5" />
									) : (
										<Menu className="h-5 w-5" />
									)}
								</Button>
							</SheetTrigger>
							<SheetContent
								side="right"
								className="w-[280px] sm:w-[320px]"
							>
								<div className="flex flex-col h-full">
									{/* Sheet header */}
									<div className="mb-6">
										<h2 className="text-lg font-semibold">
											Menu
										</h2>
									</div>

									{/* Organization selector for mobile */}
									{config.organizations.enable &&
										!config.organizations
											.hideOrganization && (
											<div className="mb-6 sm:hidden">
												<p className="text-xs text-muted-foreground mb-2">
													Organization
												</p>
												<OrganzationSelect className="w-full" />
											</div>
										)}

									{/* Menu items */}
									<div className="flex-1">
										<ul className="space-y-1">
											{secondaryItems.map((item) => (
												<li key={item.href}>
													<Link
														href={item.href}
														onClick={() =>
															setIsOpen(false)
														}
														className={cn(
															"flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
															item.isActive
																? "bg-primary/10 text-primary font-medium"
																: "text-muted-foreground hover:text-foreground hover:bg-muted",
														)}
													>
														<item.icon
															className={cn(
																"h-4 w-4",
																item.isActive
																	? "text-primary"
																	: "opacity-50",
															)}
														/>
														<span>
															{item.label}
														</span>
													</Link>
												</li>
											))}
										</ul>
									</div>

									{/* User menu at bottom */}
									<div className="mt-auto pt-6 border-t">
										<UserMenu showUserName />
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}
