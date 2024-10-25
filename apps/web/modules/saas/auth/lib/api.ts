import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useQuery } from "@tanstack/react-query";

export const sessionQueryKey = ["session"] as const;

export const useSessionQuery = () => {
	return useQuery({
		queryKey: sessionQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.getSession();

			if (error) {
				throw new Error(error.message || "Failed to fetch session");
			}

			return data;
		},
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
		retry: false,
		enabled: config.ui.saas.enabled,
	});
};
