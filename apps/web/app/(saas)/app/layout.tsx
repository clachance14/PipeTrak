import { config } from "@repo/config";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { sessionQueryKey } from "@saas/auth/lib/api";
import {
	getActiveOrganization,
	getOrganizationList,
	getSession,
} from "@saas/auth/lib/server";
import { OrganizationProvider } from "@saas/organizations/components/OrganizationProvider";
import {
	fullOrganizationQueryKey,
	organizationListQueryKey,
} from "@saas/organizations/lib/api";
import { AppLayout } from "@saas/shared/components/AppLayout";
import { ConfirmationAlertProvider } from "@saas/shared/components/ConfirmationAlertProvider";
import { getQueryClient } from "@shared/lib/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({
	children,
}: PropsWithChildren<{ params: Promise<{ organizationSlug?: string }> }>) {
	const session = await getSession();

	const queryClient = getQueryClient();

	if (!session) {
		return redirect("/auth/login");
	}

	if (config.users.enableOnboarding && !session.user.onboardingComplete) {
		return redirect("/onboarding");
	}

	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	if (config.organizations.enable && session.session.activeOrganizationId) {
		await queryClient.prefetchQuery({
			queryKey: fullOrganizationQueryKey(session.session.activeOrganizationId),
			queryFn: getActiveOrganization,
		});

		await queryClient.prefetchQuery({
			queryKey: organizationListQueryKey,
			queryFn: getOrganizationList,
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider>
				<OrganizationProvider>
					<ConfirmationAlertProvider>
						<AppLayout>{children}</AppLayout>
					</ConfirmationAlertProvider>
				</OrganizationProvider>
			</SessionProvider>
		</HydrationBoundary>
	);
}
