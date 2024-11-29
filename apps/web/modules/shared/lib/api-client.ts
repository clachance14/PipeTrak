import type { AppRouter } from "@repo/api";
import { hc } from "hono/client";

export const apiClient = hc<AppRouter>("/", {
	init: {
		credentials: "include",
	},
});
