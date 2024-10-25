"use client";

import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { UserAvatar } from "@shared/components/UserAvatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useOrganization } from "../hooks/use-organization";
import { OrganizationAvatar } from "./OrganizationAvatar";

export function OrganzationSelect({
	className,
}: {
	className?: string;
}) {
	const t = useTranslations();
	const { user } = useSession();
	const { activeOrganization, allOrganizations, setActiveOrganization } =
		useOrganization();

	if (!user) {
		return null;
	}

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left outline-none hover:bg-primary/5 focus-visible:bg-primary/10 focus-visible:ring-none">
					<div className="flex flex-1 items-center justify-start gap-2 text-sm">
						{activeOrganization ? (
							<>
								<OrganizationAvatar
									name={activeOrganization.name}
									avatarUrl={activeOrganization.logo}
									className="hidden size-6 sm:block"
								/>
								<span className="block flex-1 truncate">
									{activeOrganization.name}
								</span>
							</>
						) : (
							<>
								<UserAvatar
									className="hidden size-6 sm:block"
									name={user.name ?? ""}
									avatarUrl={user.image}
								/>
								<span className="block truncate">
									{t("organizations.organizationSelect.personalAccount")}
								</span>
							</>
						)}
					</div>

					<ChevronsUpDownIcon className="block size-4 opacity-50" />
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-full">
					<DropdownMenuRadioGroup
						value={activeOrganization?.id ?? user.id}
						onValueChange={(value: string) => {
							if (value === user.id) {
								setActiveOrganization(null);
							}
						}}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							{t("organizations.organizationSelect.personalAccount")}
						</DropdownMenuLabel>
						<DropdownMenuRadioItem
							value={user.id}
							className="flex cursor-pointer items-center justify-center gap-2 pl-3"
						>
							<div className="flex flex-1 items-center justify-start gap-2">
								<UserAvatar
									className="size-6"
									name={user.name ?? ""}
									avatarUrl={user.image}
								/>
								{user.name}
							</div>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup
						value={activeOrganization?.id}
						onValueChange={(organizationId: string) => {
							setActiveOrganization(organizationId);
						}}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							{t("organizations.organizationSelect.organizations")}
						</DropdownMenuLabel>
						{allOrganizations?.map((organization) => (
							<DropdownMenuRadioItem
								key={organization.id}
								value={organization.id}
								className="flex cursor-pointer items-center justify-center gap-2 pl-3"
							>
								<div className="flex flex-1 items-center justify-start gap-2">
									<OrganizationAvatar
										className="size-6"
										name={organization.name}
										avatarUrl={organization.logo}
									/>
									{organization.name}
								</div>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>

					{config.organizations.enableUsersToCreateOrganizations && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									asChild
									className="!text-primary cursor-pointer text-sm"
								>
									<Link href="/app/new-organization">
										<PlusIcon className="mr-2 size-6 rounded-full bg-primary/20 p-1" />
										{t(
											"organizations.organizationSelect.createNewOrganization",
										)}
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
