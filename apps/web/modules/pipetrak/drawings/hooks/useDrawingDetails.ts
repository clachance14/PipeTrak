import { useQuery } from "@tanstack/react-query";
import type { Drawing, Component } from "../../types";

interface DrawingDetailsResponse {
	drawing: Drawing & {
		project: {
			id: string;
			jobName: string;
			jobNumber: string;
			organizationId: string;
		};
		parent?: {
			id: string;
			number: string;
			title: string;
		};
		children?: Array<{
			id: string;
			number: string;
			title: string;
			_count: { components: number };
		}>;
	};
	components: Component[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface DrawingDetailsFileFilters {
	status?: string[];
	type?: string[];
	area?: string[];
	system?: string[];
	search?: string;
	page?: number;
	limit?: number;
}

export function useDrawingDetails(
	drawingId: string,
	filters: DrawingDetailsFileFilters = {},
) {
	const searchParams = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			if (Array.isArray(value)) {
				if (value.length > 0) {
					searchParams.set(key, value.join(","));
				}
			} else {
				searchParams.set(key, value.toString());
			}
		}
	});

	return useQuery({
		queryKey: ["drawings", "details", drawingId, filters],
		queryFn: async () => {
			const url = `/api/pipetrak/drawings/${drawingId}/details${
				searchParams.toString() ? `?${searchParams.toString()}` : ""
			}`;

			const response = await fetch(url, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch drawing details");
			}

			return response.json() as Promise<DrawingDetailsResponse>;
		},
		enabled: !!drawingId,
		staleTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: false,
	});
}
