import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { DrawingTreeNode } from "../../types";

interface DrawingHierarchyResponse {
	data: DrawingTreeNode[];
	metadata: {
		totalDrawings: number;
		rootDrawings: number;
	};
}

export function useDrawingHierarchy(projectId: string) {
	return useQuery({
		queryKey: ["drawings", "hierarchy", projectId],
		queryFn: async () => {
			const response = await (apiClient.pipetrak.drawings.project as any)[
				projectId
			].hierarchy.$get();

			if (!response.ok) {
				throw new Error("Failed to fetch drawing hierarchy");
			}

			const data = (await response.json()) as DrawingHierarchyResponse;
			return data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
		refetchOnWindowFocus: false,
		enabled: !!projectId,
	});
}
