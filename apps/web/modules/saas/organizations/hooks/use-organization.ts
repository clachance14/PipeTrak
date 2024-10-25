import { useContext } from "react";
import { OrganizationContext } from "../lib/organization-context";

export const useOrganization = () => {
	const organizationContext = useContext(OrganizationContext);

	if (organizationContext === undefined) {
		throw new Error("useOrganization must be used within OrganizationProvider");
	}

	return organizationContext;
};
