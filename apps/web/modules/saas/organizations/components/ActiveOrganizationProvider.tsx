"use client";

import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { sessionQueryKey } from "@saas/auth/lib/api";
import {
	activeOrganizationQueryKey,
	useActiveOrganizationQuery,
} from "@saas/organizations/lib/api";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { ActiveOrganizationContext } from "../lib/active-organization-context";

export function ActiveOrganizationProvider({
	children,
}: {
	children: ReactNode;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { session } = useSession();
	const params = useParams();

	const activeOrganizationSlug = params.organizationSlug as string;

	const { data: activeOrganization } = useActiveOrganizationQuery(
		activeOrganizationSlug,
		{
			enabled: !!activeOrganizationSlug,
		},
	);

	const refetchActiveOrganization = async () => {
		await queryClient.refetchQueries({
			queryKey: activeOrganizationQueryKey(activeOrganizationSlug),
		});
	};

	const setActiveOrganization = async (organizationId: string | null) => {
		const { data: newActiveOrganization } =
			await authClient.organization.setActive({
				organizationId,
			});

		if (!newActiveOrganization) {
			return;
		}

		await queryClient.setQueryData(
			activeOrganizationQueryKey(newActiveOrganization.slug),
			newActiveOrganization,
		);

		await queryClient.setQueryData(sessionQueryKey, (data: any) => {
			return {
				...data,
				session: {
					...data?.session,
					activeOrganizationId: newActiveOrganization.id,
				},
			};
		});

		router.replace(`/app/${newActiveOrganization.slug}`);
	};

	const [loaded, setLoaded] = useState(activeOrganization !== undefined);

	useEffect(() => {
		if (!loaded && activeOrganization !== undefined) {
			setLoaded(true);
		}
	}, [activeOrganization]);

	const activeOrganizationUserRole = activeOrganization?.members.find(
		(member) => member.userId === session?.userId,
	)?.role;

	const isOrganizationAdmin =
		!!activeOrganizationUserRole &&
		["admin", "owner"].includes(activeOrganizationUserRole);

	return (
		<ActiveOrganizationContext.Provider
			value={{
				loaded,
				activeOrganization: activeOrganization ?? null,
				activeOrganizationUserRole: activeOrganizationUserRole ?? null,
				isOrganizationAdmin,
				setActiveOrganization,
				refetchActiveOrganization,
			}}
		>
			{children}
		</ActiveOrganizationContext.Provider>
	);
}
