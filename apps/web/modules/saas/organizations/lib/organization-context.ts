import type { ActiveOrganization, Organization } from "@repo/auth";
import React from "react";

export const OrganizationContext = React.createContext<
	| {
			activeOrganization: ActiveOrganization | null;
			activeOrganizationUserRole:
				| ActiveOrganization["members"][number]["role"]
				| null;
			loaded: boolean;
			setActiveOrganization: (organizationId: string | null) => Promise<void>;
			allOrganizations: Organization[];
			refetchActiveOrganization: () => Promise<void>;
			refetchAllOrganizations: () => Promise<void>;
	  }
	| undefined
>(undefined);
