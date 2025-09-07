import "server-only";

import type { AppRouter } from "@repo/api";
import { getBaseUrl } from "@repo/utils";
import { createQueryClient } from "@shared/lib/query-client";
import { hc } from "hono/client";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerQueryClient = cache(createQueryClient);

export const getServerApiClient = async () => {
	const headersList = await headers();
	const headerObject: Record<string, string> = {};
	headersList.forEach((value, key) => {
		headerObject[key] = value;
	});

	// Extract the actual host from the request headers for dynamic port detection
	const host = headersList.get("host");
	const protocol = headersList.get("x-forwarded-proto") || "http";

	// Use the actual host if available, otherwise fall back to getBaseUrl()
	const baseUrl = host ? `${protocol}://${host}` : getBaseUrl();

	return hc<AppRouter>(baseUrl, {
		init: {
			credentials: "include",
			headers: headerObject,
		},
	}).api;
};
