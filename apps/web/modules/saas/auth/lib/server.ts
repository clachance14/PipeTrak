import "server-only";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return session;
});

export const getActiveOrganization = cache(async (slug: string) => {
	try {
		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: slug,
			},
			headers: await headers(),
		});

		return activeOrganization;
	} catch (error) {
		return null;
	}
});

export const getOrganizationList = cache(async () => {
	try {
		const organizationList = await auth.api.listOrganizations({
			headers: await headers(),
		});

		return organizationList;
	} catch (error) {
		return [];
	}
});

export const getUserAccounts = cache(async () => {
	try {
		const userAccounts = await auth.api.listUserAccounts({
			headers: await headers(),
		});

		return userAccounts;
	} catch (error) {
		return [];
	}
});

export const getOrganizationBySlug = cache(async (slug: string) => {
	try {
		const organization = await auth.api.getFullOrganization({
			headers: await headers(),
			slug,
		});

		return organization;
	} catch (error) {
		return null;
	}
});
