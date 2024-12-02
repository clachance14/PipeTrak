"use client";

import { config } from "@repo/config";
import { OrganizationAvatar } from "@saas/organizations/components/OrganizationAvatar";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { Card } from "@ui/components/card";
import { ChevronRightIcon, PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function OrganizationsGrid() {
	const t = useTranslations();
	const { data: allOrganizations } = useOrganizationListQuery();

	return (
		<div className="@container">
			<h2 className="mb-2 font-semibold text-lg">
				{t("organizations.organizationsGrid.title")}
			</h2>
			<div className="grid @2xl:grid-cols-3 @lg:grid-cols-2 grid-cols-1 gap-4">
				{allOrganizations?.map((organization) => (
					<Card key={organization.id}>
						<Link
							href={`/app/${organization.slug}`}
							className="flex items-center gap-4 overflow-hidden p-4"
						>
							<OrganizationAvatar
								name={organization.name}
								avatarUrl={organization.logo}
								className="size-12"
							/>
							<span className="flex items-center gap-1 text-base leading-tight">
								<span className="block font-medium">{organization.name}</span>
								<ChevronRightIcon className="size-4" />
							</span>
						</Link>
					</Card>
				))}

				{config.organizations.enableUsersToCreateOrganizations && (
					<Link
						href="/app/new-organization"
						className="flex h-full items-center justify-center gap-2 rounded-lg bg-primary/5 p-4 text-primary transition-colors duration-150 hover:bg-primary/10"
					>
						<PlusCircleIcon className="size-6" />
						<span className="font-medium text-sm">
							{t("organizations.organizationsGrid.createNewOrganization")}
						</span>
					</Link>
				)}
			</div>
		</div>
	);
}
