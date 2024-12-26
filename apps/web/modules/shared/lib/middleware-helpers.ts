import type { Organization, Session } from "@repo/auth";
import { getActivePlanFromPurchases } from "@saas/payments/lib/active-plan";
import { apiClient } from "@shared/lib/api-client";
import type { NextRequest } from "next/server";

export const getSession = async (req: NextRequest): Promise<Session | null> => {
	const response = await fetch(
		new URL(
			"/api/auth/get-session?disableCookieCache=true",
			req.nextUrl.origin,
		),
		{
			headers: {
				cookie: req.headers.get("cookie") || "",
			},
		},
	);

	if (!response.ok) {
		return null;
	}

	return await response.json();
};

export const getOrganizationsForSession = async (
	req: NextRequest,
): Promise<Organization[]> => {
	const response = await fetch(
		new URL("/api/auth/organization/list", req.nextUrl.origin),
		{
			headers: {
				cookie: req.headers.get("cookie") || "",
			},
		},
	);

	if (!response.ok) {
		return [];
	}

	return (await response.json()) ?? [];
};

export const getActivePlanForSession = async (
	req: NextRequest,
	organizationId?: string,
): Promise<ReturnType<typeof getActivePlanFromPurchases>> => {
	const response = await apiClient.payments.purchases.$get(
		{
			query: {
				organizationId,
			},
		},
		{
			headers: {
				cookie: req.headers.get("cookie") || "",
			},
		},
	);

	if (!response.ok) {
		return null;
	}

	const purchases = await response.json();

	return getActivePlanFromPurchases(purchases);
};
