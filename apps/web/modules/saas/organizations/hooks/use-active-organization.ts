import { useContext } from "react";
import { ActiveOrganizationContext } from "../lib/active-organization-context";

export const useActiveOrganization = () => {
	const activeOrganizationContext = useContext(ActiveOrganizationContext);

	if (activeOrganizationContext === undefined) {
		return {
			activeOrganization: null,
			setActiveOrganization: () => {},
			refetchActiveOrganization: () => {},
		};
	}

	return activeOrganizationContext;
};
