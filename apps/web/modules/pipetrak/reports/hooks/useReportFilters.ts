"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getReportFileFilterOptions } from "../lib/report-api";
import type {
	ReportFileFilters,
	ComponentDetailsFileFilters,
	AuditFileFilters,
} from "../types";

interface UseReportFileFiltersOptions {
	projectId: string;
	initialFileFilters?: Partial<ReportFileFilters>;
	persistToURL?: boolean;
	debounceMs?: number;
}

/**
 * Hook for managing report filter state with URL persistence
 */
export function useReportFileFilters({
	projectId,
	initialFileFilters = {},
	persistToURL = true,
	debounceMs = 300,
}: UseReportFileFiltersOptions) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Initialize filters from URL params or defaults
	const initializeFileFiltersFromURL = useCallback((): ReportFileFilters => {
		if (!persistToURL) return initialFileFilters as ReportFileFilters;

		const urlFileFilters: ReportFileFilters = {};

		// Parse areas from URL
		const areas = searchParams.get("areas");
		if (areas) {
			urlFileFilters.areas = areas.split(",");
		}

		// Parse systems from URL
		const systems = searchParams.get("systems");
		if (systems) {
			urlFileFilters.systems = systems.split(",");
		}

		// Parse test packages from URL
		const testPackages = searchParams.get("testPackages");
		if (testPackages) {
			urlFileFilters.testPackages = testPackages.split(",");
		}

		// Parse component types from URL
		const componentTypes = searchParams.get("componentTypes");
		if (componentTypes) {
			urlFileFilters.componentTypes = componentTypes.split(",");
		}

		// Parse statuses from URL
		const statuses = searchParams.get("statuses");
		if (statuses) {
			urlFileFilters.statuses = statuses.split(",");
		}

		// Parse date range from URL
		const dateStart = searchParams.get("dateStart");
		const dateEnd = searchParams.get("dateEnd");
		if (dateStart && dateEnd) {
			urlFileFilters.dateRange = {
				start: dateStart,
				end: dateEnd,
			};
		}

		// Parse completion range from URL
		const completionMin = searchParams.get("completionMin");
		const completionMax = searchParams.get("completionMax");
		if (completionMin || completionMax) {
			urlFileFilters.completionRange = {
				min: completionMin ? Number.parseInt(completionMin, 10) : 0,
				max: completionMax ? Number.parseInt(completionMax, 10) : 100,
			};
		}

		return { ...initialFileFilters, ...urlFileFilters };
	}, [searchParams, persistToURL, initialFileFilters]);

	const [filters, setFileFilters] = useState<ReportFileFilters>(
		initializeFileFiltersFromURL,
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
		queryFn: () => getReportFileFilterOptions(projectId),
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		enabled: !!projectId,
	});

	// Update URL when filters change
	const updateURL = useCallback(
		(newFileFilters: ReportFileFilters, newSearchQuery?: string) => {
			if (!persistToURL) return;

			const params = new URLSearchParams();

			// Add filter params
			if (newFileFilters.areas?.length) {
				params.set("areas", newFileFilters.areas.join(","));
			}
			if (newFileFilters.systems?.length) {
				params.set("systems", newFileFilters.systems.join(","));
			}
			if (newFileFilters.testPackages?.length) {
				params.set("testPackages", newFileFilters.testPackages.join(","));
			}
			if (newFileFilters.componentTypes?.length) {
				params.set(
					"componentTypes",
					newFileFilters.componentTypes.join(","),
				);
			}
			if (newFileFilters.statuses?.length) {
				params.set("statuses", newFileFilters.statuses.join(","));
			}
			if (newFileFilters.dateRange) {
				if (newFileFilters.dateRange.start)
					params.set("dateStart", newFileFilters.dateRange.start);
				if (newFileFilters.dateRange.end)
					params.set("dateEnd", newFileFilters.dateRange.end);
			}
			if (newFileFilters.completionRange) {
				if (newFileFilters.completionRange.min !== undefined) {
					params.set(
						"completionMin",
						newFileFilters.completionRange.min.toString(),
					);
				}
				if (newFileFilters.completionRange.max !== undefined) {
					params.set(
						"completionMax",
						newFileFilters.completionRange.max.toString(),
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
	const updateFileFilters = useCallback(
		(newFileFilters: Partial<ReportFileFilters>) => {
			const updatedFileFilters = { ...filters, ...newFileFilters };
			setFileFilters(updatedFileFilters);

			// Debounce URL updates
			const timeoutId = setTimeout(() => {
				updateURL(updatedFileFilters);
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
	const clearFileFilters = useCallback(() => {
		const clearedFileFilters: ReportFileFilters = {};
		setFileFilters(clearedFileFilters);
		setSearchQuery("");
		updateURL(clearedFileFilters, "");
	}, [updateURL]);

	// Get active filter count
	const activeFileFilterCount = useMemo(() => {
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
	const toComponentDetailsFileFilters =
		useCallback((): ComponentDetailsFileFilters => {
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
	const toAuditFileFilters = useCallback((): AuditFileFilters => {
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
					updateFileFilters({
						completionRange: { min: 100, max: 100 },
					});
					break;
				case "in-progress":
					updateFileFilters({
						completionRange: { min: 1, max: 99 },
					});
					break;
				case "not-started":
					updateFileFilters({
						completionRange: { min: 0, max: 0 },
					});
					break;
				case "stalled":
					// Would need additional stalled filter logic
					updateFileFilters({
						completionRange: { min: 1, max: 99 },
					});
					break;
				case "last-week": {
					const weekAgo = new Date();
					weekAgo.setDate(weekAgo.getDate() - 7);
					updateFileFilters({
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
					updateFileFilters({
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
		[updateFileFilters],
	);

	// Validation
	const validateFileFilters = useCallback((): string[] => {
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
		updateFileFilters,
		updateSearchQuery,
		clearFileFilters,
		activeFileFilterCount,
		filterOptions: filterOptions?.data,
		isLoadingOptions,
		optionsError,
		toComponentDetailsFileFilters,
		toAuditFileFilters,
		applyPreset,
		validateFileFilters,
		hasFileFilters: activeFileFilterCount > 0,
	};
}

/**
 * Simplified hook for basic filter management without URL persistence
 */
export function useSimpleReportFileFilters(initialFileFilters: ReportFileFilters = {}) {
	return useReportFileFilters({
		projectId: "",
		initialFileFilters,
		persistToURL: false,
	});
}
