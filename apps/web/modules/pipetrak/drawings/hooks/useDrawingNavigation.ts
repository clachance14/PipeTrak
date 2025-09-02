import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { DrawingNavigationState } from "../../types";

export function useDrawingNavigation(projectId: string) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Get initial state from URL
	const initialDrawingId = pathname.split("/drawings/")[1]?.split("/")[0];
	const initialExpanded = searchParams.get("expanded")?.split(",") || [];

	const [navigationState, setNavigationState] =
		useState<DrawingNavigationState>({
			selectedDrawingId: initialDrawingId,
			expandedDrawingIds: new Set(initialExpanded),
			searchQuery: searchParams.get("search") || "",
			searchResults: [],
			isSearching: false,
		});

	// Navigate to a drawing
	const navigateToDrawing = useCallback(
		(drawingId: string) => {
			const newUrl = `/app/pipetrak/${projectId}/drawings/${drawingId}`;
			router.push(newUrl);

			setNavigationState((prev) => ({
				...prev,
				selectedDrawingId: drawingId,
			}));
		},
		[projectId, router],
	);

	// Toggle drawing expansion
	const toggleDrawingExpanded = useCallback(
		(drawingId: string) => {
			setNavigationState((prev) => {
				const newExpanded = new Set(prev.expandedDrawingIds);
				if (newExpanded.has(drawingId)) {
					newExpanded.delete(drawingId);
				} else {
					newExpanded.add(drawingId);
				}

				// Update URL with expanded state
				const params = new URLSearchParams(searchParams.toString());
				if (newExpanded.size > 0) {
					params.set("expanded", Array.from(newExpanded).join(","));
				} else {
					params.delete("expanded");
				}

				const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
				router.replace(newUrl, { scroll: false });

				return {
					...prev,
					expandedDrawingIds: newExpanded,
				};
			});
		},
		[pathname, searchParams, router],
	);

	// Expand all drawings
	const expandAllDrawings = useCallback(
		(drawingIds: string[]) => {
			setNavigationState((prev) => ({
				...prev,
				expandedDrawingIds: new Set(drawingIds),
			}));

			const params = new URLSearchParams(searchParams.toString());
			params.set("expanded", drawingIds.join(","));
			const newUrl = `${pathname}?${params.toString()}`;
			router.replace(newUrl, { scroll: false });
		},
		[pathname, searchParams, router],
	);

	// Collapse all drawings
	const collapseAllDrawings = useCallback(() => {
		setNavigationState((prev) => ({
			...prev,
			expandedDrawingIds: new Set(),
		}));

		const params = new URLSearchParams(searchParams.toString());
		params.delete("expanded");
		const newUrl = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.replace(newUrl, { scroll: false });
	}, [pathname, searchParams, router]);

	// Update search query
	const setSearchQuery = useCallback(
		(query: string) => {
			setNavigationState((prev) => ({
				...prev,
				searchQuery: query,
			}));

			const params = new URLSearchParams(searchParams.toString());
			if (query) {
				params.set("search", query);
			} else {
				params.delete("search");
			}

			const newUrl = params.toString()
				? `${pathname}?${params.toString()}`
				: pathname;
			router.replace(newUrl, { scroll: false });
		},
		[pathname, searchParams, router],
	);

	// Set search results
	const setSearchResults = useCallback((results: any[]) => {
		setNavigationState((prev) => ({
			...prev,
			searchResults: results,
		}));
	}, []);

	// Set searching state
	const setIsSearching = useCallback((isSearching: boolean) => {
		setNavigationState((prev) => ({
			...prev,
			isSearching,
		}));
	}, []);

	// Navigate back to drawings list
	const navigateToDrawingsList = useCallback(() => {
		router.push(`/app/pipetrak/${projectId}/drawings`);
	}, [projectId, router]);

	// Sync state with URL changes
	useEffect(() => {
		const drawingId = pathname.split("/drawings/")[1]?.split("/")[0];
		const expanded = searchParams.get("expanded")?.split(",") || [];
		const search = searchParams.get("search") || "";

		setNavigationState((prev) => ({
			...prev,
			selectedDrawingId: drawingId,
			expandedDrawingIds: new Set(expanded),
			searchQuery: search,
		}));
	}, [pathname, searchParams]);

	return {
		navigationState,
		navigateToDrawing,
		toggleDrawingExpanded,
		expandAllDrawings,
		collapseAllDrawings,
		setSearchQuery,
		setSearchResults,
		setIsSearching,
		navigateToDrawingsList,
	};
}
