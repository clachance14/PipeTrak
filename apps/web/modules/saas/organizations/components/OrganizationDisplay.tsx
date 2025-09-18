"use client";

import { config } from "@repo/config";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { ActivePlanBadge } from "@saas/payments/components/ActivePlanBadge";
import { cn } from "@ui/lib";
import { OrganizationLogo } from "./OrganizationLogo";

export function OrganizationDisplay({ className }: { className?: string }) {
	const { activeOrganization } = useActiveOrganization();

	if (!activeOrganization) {
		return null;
	}

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<OrganizationLogo
				name={activeOrganization.name}
				logoUrl={activeOrganization.logo}
				className="size-6"
			/>
			<div className="flex flex-1 items-center gap-2 min-w-0">
				<span className="block flex-1 truncate text-sm font-medium">
					{activeOrganization.name}
				</span>
				{config.organizations.enableBilling && (
					<ActivePlanBadge organizationId={activeOrganization.id} />
				)}
			</div>
		</div>
	);
}
