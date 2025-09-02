"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getReportFilterOptions } from "../lib/report-api";
import type {
	ReportFilters,
	ComponentDetailsFilters,
	AuditFilters,
} from "../types";

interface UseReportFiltersOptions {
	projectId: string;
	initialFilters?: Partial<ReportFilters>;
	persistToURL?: boolean;
	debounceMs?: number;
}

/**
 * Hook for managing report filter state with URL persistence
 */
export function useReportFilters({
	projectId,
	initialFilters = {},
	persistToURL = true,
	debounceMs = 300,
}: UseReportFiltersOptions) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Initialize filters from URL params or defaults
	const initializeFiltersFromURL = useCallback((): ReportFilters => {
		if (!persistToURL) return initialFilters as ReportFilters;

		const urlFilters: ReportFilters = {};

		// Parse areas from URL
		const areas = searchParams.get("areas");
		if (areas) {
			urlFilters.areas = areas.split(",");
		}

		// Parse systems from URL
		const systems = searchParams.get("systems");
		if (systems) {
			urlFilters.systems = systems.split(",");
		}

		// Parse test packages from URL
		const testPackages = searchParams.get("testPackages");
		if (testPackages) {
			urlFilters.testPackages = testPackages.split(",");
		}

		// Parse component types from URL
		const componentTypes = searchParams.get("componentTypes");
		if (componentTypes) {
			urlFilters.componentTypes = componentTypes.split(",");
		}

		// Parse statuses from URL
		const statuses = searchParams.get("statuses");
		if (statuses) {
			urlFilters.statuses = statuses.split(",");
		}

		// Parse date range from URL
		const dateStart = searchParams.get("dateStart");
		const dateEnd = searchParams.get("dateEnd");
		if (dateStart && dateEnd) {
			urlFilters.dateRange = {
				start: dateStart,
				end: dateEnd,
			};
		}

		// Parse completion range from URL
		const completionMin = searchParams.get("completionMin");
		const completionMax = searchParams.get("completionMax");
		if (completionMin || completionMax) {
			urlFilters.completionRange = {
				min: completionMin ? Number.parseInt(completionMin, 10) : 0,
				max: completionMax ? Number.parseInt(completionMax, 10) : 100,
			};
		}

		return { ...initialFilters, ...urlFilters };
	}, [searchParams, persistToURL, initialFilters]);

	const [filters, setFilters] = useState<ReportFilters>(
		initializeFiltersFromURL,
	);
	const [searchQuery, setSearchQuery] = useState(
		searchParams.get("search") || "",
	);

	// Fetch filter options
	const {
		data: filterOptions,
		isLoading: isLoadingOptions,
		error: optionsError,
	} = useQuery({
		queryKey: ["report-filter-options", projectId],
		queryFn: () => getReportFilterOptions(projectId),
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		enabled: !!projectId,
	});

	// Update URL when filters change
	const updateURL = useCallback(
		(newFilters: ReportFilters, newSearchQuery?: string) => {
			if (!persistToURL) return;

			const params = new URLSearchParams();

			// Add filter params
			if (newFilters.areas?.length) {
				params.set("areas", newFilters.areas.join(","));
			}
			if (newFilters.systems?.length) {
				params.set("systems", newFilters.systems.join(","));
			}
			if (newFilters.testPackages?.length) {
				params.set("testPackages", newFilters.testPackages.join(","));
			}
			if (newFilters.componentTypes?.length) {
				params.set(
					"componentTypes",
					newFilters.componentTypes.join(","),
				);
			}
			if (newFilters.statuses?.length) {
				params.set("statuses", newFilters.statuses.join(","));
			}
			if (newFilters.dateRange) {
				if (newFilters.dateRange.start)
					params.set("dateStart", newFilters.dateRange.start);
				if (newFilters.dateRange.end)
					params.set("dateEnd", newFilters.dateRange.end);
			}
			if (newFilters.completionRange) {
				if (newFilters.completionRange.min !== undefined) {
					params.set(
						"completionMin",
						newFilters.completionRange.min.toString(),
					);
				}
				if (newFilters.completionRange.max !== undefined) {
					params.set(
						"completionMax",
						newFilters.completionRange.max.toString(),
					);
				}
			}

			// Add search query
			const searchValue =
				newSearchQuery !== undefined ? newSearchQuery : searchQuery;
			if (searchValue) {
				params.set("search", searchValue);
			}

			const newURL = params.toString()
				? `${pathname}?${params.toString()}`
				: pathname;
			router.replace(newURL, { scroll: false });
		},
		[persistToURL, pathname, router, searchQuery],
	);

	// Update filters with debouncing
	const updateFilters = useCallback(
		(newFilters: Partial<ReportFilters>) => {
			const updatedFilters = { ...filters, ...newFilters };
			setFilters(updatedFilters);

			// Debounce URL updates
			const timeoutId = setTimeout(() => {
				updateURL(updatedFilters);
			}, debounceMs);

			return () => clearTimeout(timeoutId);
		},
		[filters, updateURL, debounceMs],
	);

	// Update search query
	const updateSearchQuery = useCallback(
		(query: string) => {
			setSearchQuery(query);

			// Immediate URL update for search
			updateURL(filters, query);
		},
		[filters, updateURL],
	);

	// Clear all filters
	const clearFilters = useCallback(() => {
		const clearedFilters: ReportFilters = {};
		setFilters(clearedFilters);
		setSearchQuery("");
		updateURL(clearedFilters, "");
	}, [updateURL]);

	// Get active filter count
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.areas?.length) count++;
		if (filters.systems?.length) count++;
		if (filters.testPackages?.length) count++;
		if (filters.componentTypes?.length) count++;
		if (filters.statuses?.length) count++;
		if (filters.dateRange) count++;
		if (filters.completionRange) count++;
		if (searchQuery) count++;
		return count;
	}, [filters, searchQuery]);

	// Convert to component details filters format
	const toComponentDetailsFilters =
		useCallback((): ComponentDetailsFilters => {
			return {
				areas: filters.areas,
				systems: filters.systems,
				testPackages: filters.testPackages,
				statuses: filters.statuses,
				componentTypes: filters.componentTypes,
				completionMin: filters.completionRange?.min,
				completionMax: filters.completionRange?.max,
				searchQuery: searchQuery || undefined,
			};
		}, [filters, searchQuery]);

	// Convert to audit filters format
	const toAuditFilters = useCallback((): AuditFilters => {
		return {
			startDate: filters.dateRange?.start,
			endDate: filters.dateRange?.end,
			// Add other audit-specific filters as needed
		};
	}, [filters]);

	// Preset filter functions
	const applyPreset = useCallback(
		(presetName: string) => {
			switch (presetName) {
				case "completed":
					updateFilters({
						completionRange: { min: 100, max: 100 },
					});
					break;
				case "in-progress":
					updateFilters({
						completionRange: { min: 1, max: 99 },
					});
					break;
				case "not-started":
					updateFilters({
						completionRange: { min: 0, max: 0 },
					});
					break;
				case "stalled":
					// Would need additional stalled filter logic
					updateFilters({
						completionRange: { min: 1, max: 99 },
					});
					break;
				case "last-week": {
					const weekAgo = new Date();
					weekAgo.setDate(weekAgo.getDate() - 7);
					updateFilters({
						dateRange: {
							start: weekAgo.toISOString().split("T")[0],
							end: new Date().toISOString().split("T")[0],
						},
					});
					break;
				}
				case "last-month": {
					const monthAgo = new Date();
					monthAgo.setMonth(monthAgo.getMonth() - 1);
					updateFilters({
						dateRange: {
							start: monthAgo.toISOString().split("T")[0],
							end: new Date().toISOString().split("T")[0],
						},
					});
					break;
				}
				default:
					console.warn(`Unknown preset: ${presetName}`);
			}
		},
		[updateFilters],
	);

	// Validation
	const validateFilters = useCallback((): string[] => {
		const errors: string[] = [];

		if (filters.completionRange) {
			const { min, max } = filters.completionRange;
			if (min !== undefined && max !== undefined && min > max) {
				errors.push(
					"Minimum completion percentage cannot be greater than maximum",
				);
			}
			if (min !== undefined && (min < 0 || min > 100)) {
				errors.push("Completion percentage must be between 0 and 100");
			}
			if (max !== undefined && (max < 0 || max > 100)) {
				errors.push("Completion percentage must be between 0 and 100");
			}
		}

		if (filters.dateRange) {
			const { start, end } = filters.dateRange;
			if (start && end && new Date(start) > new Date(end)) {
				errors.push("Start date cannot be after end date");
			}
		}

		return errors;
	}, [filters]);

	return {
		filters,
		searchQuery,
		updateFilters,
		updateSearchQuery,
		clearFilters,
		activeFilterCount,
		filterOptions: filterOptions?.data,
		isLoadingOptions,
		optionsError,
		toComponentDetailsFilters,
		toAuditFilters,
		applyPreset,
		validateFilters,
		hasFilters: activeFilterCount > 0,
	};
}

/**
 * Simplified hook for basic filter management without URL persistence
 */
export function useSimpleReportFilters(initialFilters: ReportFilters = {}) {
	return useReportFilters({
		projectId: "",
		initialFilters,
		persistToURL: false,
	});
}
