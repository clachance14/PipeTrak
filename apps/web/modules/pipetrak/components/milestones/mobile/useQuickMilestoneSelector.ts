"use client";

import { useCallback, useState } from "react";
import type { ComponentWithMilestones } from "../../../types";

interface UseQuickMilestoneSelectorReturn {
	isOpen: boolean;
	selectedComponent: ComponentWithMilestones | null;
	isLoading: boolean;
	error: string | null;
	isOffline: boolean;
	openSelector: (component: ComponentWithMilestones) => void;
	closeSelector: () => void;
	toggleSelector: (component: ComponentWithMilestones) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setOffline: (offline: boolean) => void;
	retry: () => void;
}

/**
 * Hook to manage the Quick Milestone Selector state
 *
 * @example
 * ```tsx
 * const { isOpen, selectedComponent, openSelector, closeSelector } = useQuickMilestoneSelector();
 *
 * // In your component list
 * <button onClick={() => openSelector(component)}>
 *   Quick Update
 * </button>
 *
 * // Render the selector
 * {selectedComponent && (
 *   <QuickMilestoneSelector
 *     component={selectedComponent}
 *     isOpen={isOpen}
 *     onClose={closeSelector}
 *   />
 * )}
 * ```
 */
export function useQuickMilestoneSelector(): UseQuickMilestoneSelectorReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedComponent, setSelectedComponent] =
		useState<ComponentWithMilestones | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isOffline, setIsOffline] = useState(false);

	const openSelector = useCallback((component: ComponentWithMilestones) => {
		setSelectedComponent(component);
		setIsOpen(true);
		setError(null); // Clear any previous errors
	}, []);

	const closeSelector = useCallback(() => {
		setIsOpen(false);
		// Keep selectedComponent until animation completes
		setTimeout(() => {
			setSelectedComponent(null);
		}, 300);
	}, []);

	const toggleSelector = useCallback(
		(component: ComponentWithMilestones) => {
			if (isOpen && selectedComponent?.id === component.id) {
				closeSelector();
			} else {
				openSelector(component);
			}
		},
		[isOpen, selectedComponent?.id, openSelector, closeSelector],
	);

	const setLoading = useCallback((loading: boolean) => {
		setIsLoading(loading);
	}, []);

	const setErrorState = useCallback((errorMessage: string | null) => {
		setError(errorMessage);
	}, []);

	const setOfflineState = useCallback((offline: boolean) => {
		setIsOffline(offline);
	}, []);

	const retry = useCallback(() => {
		setError(null);
		setIsLoading(true);
		// Parent component should handle the actual retry logic
	}, []);

	return {
		isOpen,
		selectedComponent,
		isLoading,
		error,
		isOffline,
		openSelector,
		closeSelector,
		toggleSelector,
		setLoading,
		setError: setErrorState,
		setOffline: setOfflineState,
		retry,
	};
}

export default useQuickMilestoneSelector;
