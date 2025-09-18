import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { DrawingSearchResult } from "../../types";

interface DrawingSearchResponse {
	results: DrawingSearchResult[];
}

export function useDrawingSearch(
	projectId: string,
	query: string,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: ["drawings", "search", projectId, query],
		queryFn: async () => {
			const response = await (apiClient.pipetrak.drawings.project as any)[
				projectId
			].search.$get({
				query: { q: query, limit: "20" },
			});

			if (!response.ok) {
				throw new Error("Search failed");
			}

			const data = (await response.json()) as DrawingSearchResponse;
			return data.results;
		},
		enabled: options?.enabled !== false && query.length >= 2 && !!projectId,
		staleTime: 1 * 60 * 1000, // 1 minute for search results
		refetchOnWindowFocus: false,
		refetchInterval: false, // Disable automatic refetching
	});
}
