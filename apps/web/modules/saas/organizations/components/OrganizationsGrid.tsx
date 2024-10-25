"use client";

import { config } from "@repo/config";
import { Card } from "@ui/components/card";
import { ChevronRightIcon, PlusCircleIcon, Users2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useOrganization } from "../hooks/use-organization";

export function OrganizationsGrid() {
	const t = useTranslations();
	const { setActiveOrganization, allOrganizations } = useOrganization();

	return (
		<>
			<h2 className="mb-2 font-semibold text-lg">
				{t("organizations.organizationsGrid.title")}
			</h2>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{allOrganizations?.map((organization) => (
					<Card
						key={organization.id}
						className="cursor-pointer overflow-hidden p-6"
						onClick={() => {
							setActiveOrganization(organization.id);
						}}
					>
						<Users2Icon className="mb-2 block size-8 text-primary opacity-50" />
						<span className="flex items-center gap-1 text-base leading-tight">
							<span className="block font-medium">{organization.name}</span>
							<ChevronRightIcon className="size-4" />
						</span>
					</Card>
				))}

				{config.organizations.enableUsersToCreateOrganizations && (
					<Link
						href="/app/new-organization"
						className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-primary/5 p-6 text-primary transition-colors duration-150 hover:bg-primary/10"
					>
						<PlusCircleIcon className="size-8" />
						<p className="font-medium text-sm">
							{t("organizations.organizationsGrid.createNewOrganization")}
						</p>
					</Link>
				)}
			</div>
		</>
	);
}
