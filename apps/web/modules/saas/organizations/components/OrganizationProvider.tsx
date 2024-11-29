"use client";

import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { sessionQueryKey } from "@saas/auth/lib/api";
import {
	fullOrganizationQueryKey,
	organizationListQueryKey,
	useFullOrganizationQuery,
	useOrganizationListQuery,
} from "@saas/organizations/lib/api";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { OrganizationContext } from "../lib/organization-context";

export function OrganizationProvider({
	children,
}: {
	children: ReactNode;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { session } = useSession();

	const { data: activeOrganization } = useFullOrganizationQuery(
		session?.activeOrganizationId ?? undefined,
	);
	const { data: allOrganizations } = useOrganizationListQuery();

	const refetchActiveOrganization = async () => {
		await queryClient.refetchQueries({ queryKey: fullOrganizationQueryKey() });
	};

	const refetchAllOrganizations = async () => {
		await queryClient.refetchQueries({ queryKey: organizationListQueryKey });
	};

	const setActiveOrganization = async (organizationId: string | null) => {
		const { data: newActiveOrganization } =
			await authClient.organization.setActive({
				organizationId,
			});

		await queryClient.setQueryData(
			fullOrganizationQueryKey(),
			newActiveOrganization,
		);

		await queryClient.setQueryData(sessionQueryKey, (data: any) => {
			return {
				...data,
				session: {
					...data?.session,
					activeOrganizationId: organizationId,
				},
			};
		});

		router.refresh();
	};

	const [loaded, setLoaded] = useState(allOrganizations !== undefined);

	useEffect(() => {
		if (
			!loaded &&
			allOrganizations !== undefined &&
			activeOrganization !== undefined
		) {
			setLoaded(true);
		}
	}, [allOrganizations, activeOrganization]);

	const activeOrganizationUserRole = activeOrganization?.members.find(
		(member) => member.id === session?.userId,
	)?.role;

	return (
		<OrganizationContext.Provider
			value={{
				loaded,
				activeOrganization: activeOrganization ?? null,
				activeOrganizationUserRole: activeOrganizationUserRole ?? null,
				allOrganizations: allOrganizations ?? [],
				setActiveOrganization,
				refetchActiveOrganization,
				refetchAllOrganizations,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}
