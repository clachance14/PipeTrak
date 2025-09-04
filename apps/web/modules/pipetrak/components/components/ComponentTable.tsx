"use client";

import {
	useState,
	useMemo,
	useCallback,
	useTransition,
	useEffect,
	useRef,
} from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	type ColumnDef,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
	type RowSelectionState,
	type ColumnSizingState,
	type ColumnOrderState,
} from "@tanstack/react-table";
import { MobileDrawingGroup } from "./MobileDrawingGroup";
import { DrawingGroup } from "./DrawingGroup";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { BulkMilestoneModal } from "./BulkMilestoneModal";
import { MilestoneUpdateModal } from "./MilestoneUpdateModal";
import { MobileMilestoneSheet } from "../milestones/mobile/MobileMilestoneSheet";
import { ComponentHoverCard } from "./ComponentHoverCard";
import { FieldWeldQuickView } from "./FieldWeldQuickView";
// import { FilterBar, type FilterState } from "./FilterBar"; // Commented out - component not found
import { DirectEditMilestoneColumn } from "../milestones/integration/DirectEditMilestoneColumn";
import { InlineDiscreteMilestones } from "../milestones/integration/InlineDiscreteMilestones";
import { MilestoneUpdateEngine } from "../milestones/core/MilestoneUpdateEngine";
import { RealtimeManager } from "../milestones/realtime/RealtimeManager";
import { applyComponentFileFilters } from "../lib/bulk-update-utils";
import { createBulkUpdateService } from "../lib/bulk-update-service";
import {
	VIEW_PRESETS,
	applyViewPreset,
	getSavedPreset,
	getDefaultPreset,
	type ViewPreset,
} from "../view-presets";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@ui/components/dropdown-menu";
import {
	Search,
	Filter,
	Download,
	Upload,
	RefreshCw,
	ChevronUp,
	ChevronDown,
	Check,
	Columns,
	Maximize2,
	Minimize2,
	Settings,
	HardHat,
	Wrench,
	BarChart3,
	Table2,
	Zap,
	AlertTriangle,
	XCircle,
	Clock,
	FlameKindling,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@ui/lib";
import { useRouter } from "next/navigation";
import type { ComponentWithMilestones } from "../../types";
import { ComponentStatus } from "../../types";
import { apiClient } from "@shared/lib/api-client";
import { getBaseUrl } from "@repo/utils";

// Augment TanStack Table meta to include our updateData helper used by editable cells
declare module "@tanstack/react-table" {
	interface TableMeta<TData> {
		updateData: (rowIndex: number, columnId: string, value: unknown) => void;
	}
}

interface ComponentTableProps {
	components: ComponentWithMilestones[];
	projectId: string;
	userId?: string;
}

// Editable cell component for inline editing
function EditableCell({
	getValue,
	row,
	column,
	table,
}: {
	getValue: () => any;
	row: any;
	column: any;
	table: any;
}) {
	const initialValue = getValue();
	const [value, setValue] = useState(initialValue);
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const onBlur = () => {
		setIsEditing(false);
		if (value !== initialValue) {
			table.options.meta?.updateData(row.index, column.id, value);
		}
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			onBlur();
		} else if (e.key === "Escape") {
			setValue(initialValue);
			setIsEditing(false);
		}
	};

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
			/>
		);
	}

	const displayValue = value || "-";
	const shouldTruncate =
		column.id !== "description" && displayValue.length > 20;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						onDoubleClick={() => setIsEditing(true)}
						className="w-full h-full flex items-center px-2 cursor-text hover:bg-gray-50 text-sm"
					>
						<span className={shouldTruncate ? "truncate" : ""}>
							{displayValue}
						</span>
					</div>
				</TooltipTrigger>
				{displayValue !== "-" && (
					<TooltipContent>
						<p>{displayValue}</p>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	);
}

// Status cell with color coding
function StatusCell({ getValue }: { getValue: () => any }) {
	const status = getValue();

	const statusConfig = {
		NOT_STARTED: {
			label: "Not Started",
			color: "bg-gray-100 text-gray-700",
			icon: "○",
		},
		IN_PROGRESS: {
			label: "In Progress",
			color: "bg-blue-100 text-blue-700",
			icon: "◐",
		},
		COMPLETED: {
			label: "Completed",
			color: "bg-green-100 text-green-700",
			icon: "●",
		},
	};

	const config =
		statusConfig[status as keyof typeof statusConfig] ||
		statusConfig.NOT_STARTED;

	return (
		<div className="flex items-center gap-2 px-2">
			<span className={cn("text-lg", config.color.split(" ")[1])}>
				{config.icon}
			</span>
			<Badge className={cn("font-medium", config.color)}>
				{config.label}
			</Badge>
		</div>
	);
}

// Progress cell with visual bar
function ProgressCell({ getValue }: { getValue: () => any }) {
	const progress = getValue() || 0;

	return (
		<div className="flex items-center gap-2 px-2 w-full">
			<Progress value={progress} className="h-2 flex-1" />
			<span className="text-sm font-medium w-12 text-right">
				{progress}%
			</span>
		</div>
	);
}

export function ComponentTable({
	components: initialComponents,
	projectId,
	userId = "",
}: ComponentTableProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [data, setData] = useState(initialComponents);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "componentId", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		{},
	);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	// Initialize with empty state to avoid hydration mismatch
	const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [isMobile, setIsMobile] = useState(false);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
	const [showMilestoneModal, setShowMilestoneModal] = useState(false);
	const [mobileSelectedIds, setMobileSelectedIds] = useState<Set<string>>(
		new Set(),
	);
	const [expandedDrawings, setExpandedDrawings] = useState<Set<string>>(
		new Set(),
	);
	const [activePreset, setActivePreset] = useState<ViewPreset>(
		getDefaultPreset(),
	);
	const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
	const [selectedMobileComponent, setSelectedMobileComponent] =
		useState<ComponentWithMilestones | null>(null);

	// Default column IDs in the order they appear
	const defaultColumnIds = [
		"select",
		"componentId",
		"instance",
		"type",
		"size",
		"spec",
		"material",
		"area",
		"system",
		"testPackage",
		"milestones",
		"status",
		"completionPercent",
	];

	// Column ordering state - initialize with default order
	const [columnOrder, setColumnOrder] =
		useState<ColumnOrderState>(defaultColumnIds);
	const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
	const [targetColumn, setTargetColumn] = useState<string | null>(null);

	// New filter states - temporarily using any type
	const [filters, setFilters] = useState<any>({
		area: "all",
		testPackage: "all",
		system: "all",
		type: "all",
		status: "all",
		search: "",
	});
	const [showBulkMilestoneModal, setShowBulkMilestoneModal] = useState(false);

	// Track component selection count for reliable UI state
	const [selectionCount, setSelectionCount] = useState(0);

	// Refs
	const fullScreenContainerRef = useRef<HTMLDivElement>(null);
	const hasLoadedSizesRef = useRef(false);

	// Detect mobile viewport and adjust column visibility
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			// More precise mobile detection: only phones (< 768px), tablets use desktop view
			setIsMobile(width < 768);

			// Tablet-optimized responsive column hiding
			const newVisibility: VisibilityState = {};
			if (width < 768) {
				// Phone: Hide most secondary columns
				newVisibility.spec = false;
				newVisibility.material = false;
				newVisibility.size = false;
				newVisibility.area = false;
				newVisibility.system = false;
			} else if (width < 1024) {
				// Tablet: Keep essential columns visible, hide only least important
				newVisibility.spec = false;
				newVisibility.material = false;
			} else if (width < 1400) {
				// Small desktop: Hide only spec column
				newVisibility.spec = false;
			}

			setColumnVisibility((prev) => ({
				...prev,
				...newVisibility,
			}));
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Load saved preset and column settings from localStorage after mount
	useEffect(() => {
		// Load saved preset or use default
		const savedPreset = getSavedPreset();
		setActivePreset(savedPreset);

		// Apply preset settings if no custom settings are saved
		const savedSizes = localStorage.getItem("pipetrak-column-sizes");
		const savedOrder = localStorage.getItem("pipetrak-column-order");
		const savedVisibility = localStorage.getItem(
			"pipetrak-column-visibility",
		);

		if (!savedSizes && !savedOrder && !savedVisibility) {
			// No custom settings, apply preset
			applyViewPreset(
				savedPreset,
				setColumnVisibility,
				setColumnSizing,
				setColumnOrder,
			);
		} else {
			// Load custom settings
			if (savedSizes) {
				try {
					const parsed = JSON.parse(savedSizes);
					setColumnSizing(parsed);
				} catch (e) {
					console.error("Failed to parse saved column sizes:", e);
				}
			}

			if (savedOrder) {
				try {
					const parsed = JSON.parse(savedOrder);
					setColumnOrder(parsed);
				} catch (e) {
					console.error("Failed to parse saved column order:", e);
				}
			}

			if (savedVisibility) {
				try {
					const parsed = JSON.parse(savedVisibility);
					// Ensure type column is always visible
					parsed.type = true;
					setColumnVisibility(parsed);
				} catch (e) {
					console.error(
						"Failed to parse saved column visibility:",
						e,
					);
				}
			}
		}

		// Force type column to be visible and ensure instance column is visible
		setColumnVisibility((prev) => ({
			...prev,
			type: true,
			instance: true,
		}));

		// Clear any old localStorage settings that might conflict
		// This can be removed after users have updated their settings
		if (typeof window !== "undefined") {
			const savedVis = localStorage.getItem("pipetrak-column-visibility");
			if (savedVis) {
				try {
					const parsed = JSON.parse(savedVis);
					if (parsed.type === false || parsed.description === true) {
						// User has old settings, clear and reset
						localStorage.removeItem("pipetrak-column-visibility");
						localStorage.removeItem("pipetrak-column-order");
						localStorage.removeItem("pipetrak-active-preset");
					}
				} catch (e) {
					// Invalid saved data, clear it
					localStorage.removeItem("pipetrak-column-visibility");
				}
			}
		}

		const savedExpanded = localStorage.getItem(
			"pipetrak-expanded-drawings",
		);
		if (savedExpanded) {
			try {
				const parsed = JSON.parse(savedExpanded);
				setExpandedDrawings(new Set(parsed));
			} catch (e) {
				console.error("Failed to parse saved expanded drawings:", e);
			}
		}

		hasLoadedSizesRef.current = true;
	}, []); // Only run once on mount

	// Save column sizes to localStorage when they change (only after initial load)
	useEffect(() => {
		// Skip saving on initial mount or if sizes haven't been loaded yet
		if (!hasLoadedSizesRef.current) return;

		if (Object.keys(columnSizing).length > 0) {
			localStorage.setItem(
				"pipetrak-column-sizes",
				JSON.stringify(columnSizing),
			);
		}
	}, [columnSizing]);

	// Save column order to localStorage when it changes
	useEffect(() => {
		// Skip saving on initial mount or if sizes haven't been loaded yet
		if (!hasLoadedSizesRef.current) return;

		if (columnOrder.length > 0) {
			localStorage.setItem(
				"pipetrak-column-order",
				JSON.stringify(columnOrder),
			);
		}
	}, [columnOrder]);

	// Save expanded drawings to localStorage when they change
	useEffect(() => {
		if (!hasLoadedSizesRef.current) return;

		localStorage.setItem(
			"pipetrak-expanded-drawings",
			JSON.stringify(Array.from(expandedDrawings)),
		);
	}, [expandedDrawings]);

	// Save column visibility to localStorage when it changes
	useEffect(() => {
		if (!hasLoadedSizesRef.current) return;

		if (Object.keys(columnVisibility).length > 0) {
			localStorage.setItem(
				"pipetrak-column-visibility",
				JSON.stringify(columnVisibility),
			);
		}
	}, [columnVisibility]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// F key or F11 for full-screen toggle
			if (
				e.key === "f" &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				!e.shiftKey
			) {
				// Only toggle if not typing in an input
				const target = e.target as HTMLElement;
				if (
					target.tagName !== "INPUT" &&
					target.tagName !== "TEXTAREA"
				) {
					e.preventDefault();
					setIsFullScreen((prev) => !prev);
				}
			} else if (e.key === "F11") {
				e.preventDefault();
				setIsFullScreen((prev) => !prev);
			} else if (e.key === "Escape" && isFullScreen) {
				setIsFullScreen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFullScreen]);

	// Define columns with drawing leftmost
	const columns = useMemo<ColumnDef<ComponentWithMilestones>[]>(
		() => [
			// Selection column
			{
				id: "select",
				size: 50,
				minSize: 40,
				maxSize: 60,
				enableResizing: false,
				header: ({ table }) => (
					<div className="flex items-center justify-center">
						<input
							type="checkbox"
							checked={table.getIsAllPageRowsSelected()}
							onChange={table.getToggleAllPageRowsSelectedHandler()}
							className="h-4 w-4"
						/>
					</div>
				),
				cell: ({ row }) => (
					<div className="flex items-center justify-center">
						<input
							type="checkbox"
							checked={row.getIsSelected()}
							onChange={row.getToggleSelectedHandler()}
							onClick={(e) => e.stopPropagation()}
							className="h-4 w-4"
						/>
					</div>
				),
			},
			// Component ID (primary column) with hover card
			{
				accessorKey: "componentId",
				size: 200,
				minSize: 150,
				maxSize: 250,
				header: "Component ID",
				cell: ({ row, getValue }) => {
					const value = getValue() as string;
					const component = row.original;
					return (
						<ComponentHoverCard
							component={component}
							onEdit={() =>
								router.push(
									`/app/pipetrak/${projectId}/components/${component.id}/edit`,
								)
							}
							onViewHistory={() =>
								toast.info("History view coming soon")
							}
							onAddNote={() =>
								toast.info("Notes feature coming soon")
							}
						>
							<div
								className="font-mono font-bold text-[13px] text-gray-900 px-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-blue-600 transition-colors"
								title={value}
							>
								{value}
							</div>
						</ComponentHoverCard>
					);
				},
				enableSorting: true,
			},
			// Instance Information
			{
				id: "instance",
				header: "Instance",
				cell: ({ row }) => {
					const component = row.original;
					const instanceNumber = component.instanceNumber || 1;
					const totalInstances =
						component.totalInstancesOnDrawing || 1;

					if (totalInstances === 1) {
						return (
							<div className="px-2 text-sm text-gray-600">1</div>
						);
					}

					return (
						<div className="px-2">
							<Badge
								status="info"
								className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
							>
								{instanceNumber} of {totalInstances}
							</Badge>
						</div>
					);
				},
				size: 100,
				minSize: 80,
				maxSize: 120,
				enableSorting: true,
				sortingFn: (rowA, rowB) => {
					const a = rowA.original.instanceNumber || 1;
					const b = rowB.original.instanceNumber || 1;
					return a - b;
				},
			},
			// Type (was description) - Enhanced with field weld indicators
			{
				accessorKey: "type",
				header: "Type",
				cell: ({ getValue, row, column, table }) => {
					const initialValue = getValue();
					const [value, setValue] = useState(initialValue);
					const [isEditing, setIsEditing] = useState(false);
					const inputRef = useRef<HTMLInputElement>(null);
					const component = row.original;

					// Get organization slug from URL for field weld quick view
					const organizationSlug =
						typeof window !== "undefined"
							? window.location.pathname.split("/")[2]
							: "";

					const onBlur = () => {
						setIsEditing(false);
						if (value !== initialValue) {
							table.options.meta?.updateData(
								row.index,
								column.id,
								value,
							);
						}
					};

					const onKeyDown = (e: React.KeyboardEvent) => {
						if (e.key === "Enter") {
							onBlur();
						} else if (e.key === "Escape") {
							setValue(initialValue);
							setIsEditing(false);
						}
					};

					useEffect(() => {
						if (isEditing && inputRef.current) {
							inputRef.current.focus();
							inputRef.current.select();
						}
					}, [isEditing]);

					useEffect(() => {
						setValue(initialValue);
					}, [initialValue]);

					if (isEditing) {
						return (
							<input
								ref={inputRef}
								value={(value as string) || ""}
								onChange={(e) => setValue(e.target.value)}
								onBlur={onBlur}
								onKeyDown={onKeyDown}
								className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
							/>
						);
					}

					const displayValue = (value as string) || "-";
					const isFieldWeld = displayValue === "FIELD_WELD";

					// Get QC status for field welds
					const getFieldWeldBadges = () => {
						if (
							!isFieldWeld ||
							!component.fieldWelds ||
							component.fieldWelds.length === 0
						) {
							return null;
						}

						const fieldWeld = component.fieldWelds[0];
						const badges = [];

						// NDE status badge
						if (fieldWeld.ndeResult) {
							switch (fieldWeld.ndeResult.toLowerCase()) {
								case "accept":
									badges.push(
										<Badge
											key="nde"
											status="info"
											className="h-4 text-xs bg-green-100 text-green-800"
										>
											<Check className="h-2 w-2 mr-1" />
											NDE OK
										</Badge>,
									);
									break;
								case "reject":
									badges.push(
										<Badge
											key="nde"
											status="error"
											className="h-4 text-xs"
										>
											<XCircle className="h-2 w-2 mr-1" />
											NDE Reject
										</Badge>,
									);
									break;
								case "repair":
									badges.push(
										<Badge
											key="nde"
											status="info"
											className="h-4 text-xs bg-orange-100 text-orange-800"
										>
											<AlertTriangle className="h-2 w-2 mr-1" />
											Repair
										</Badge>,
									);
									break;
							}
						} else {
							badges.push(
								<Badge
									key="nde"
									status="info"
									className="h-4 text-xs"
								>
									<Clock className="h-2 w-2 mr-1" />
									NDE Pending
								</Badge>,
							);
						}

						// PWHT status badge
						if (fieldWeld.pwhtRequired) {
							if (fieldWeld.datePwht) {
								badges.push(
									<Badge
										key="pwht"
										status="info"
										className="h-4 text-xs bg-blue-100 text-blue-800"
									>
										<FlameKindling className="h-2 w-2 mr-1" />
										PWHT OK
									</Badge>,
								);
							} else {
								badges.push(
									<Badge
										key="pwht"
										status="info"
										className="h-4 text-xs bg-yellow-100 text-yellow-800"
									>
										<FlameKindling className="h-2 w-2 mr-1" />
										PWHT Req
									</Badge>,
								);
							}
						}

						return badges;
					};

					const fieldWeldBadges = getFieldWeldBadges();

					const typeDisplay = (
						<div
							onDoubleClick={() => setIsEditing(true)}
							className="w-full min-h-[52px] flex flex-col gap-1 px-2 py-1 cursor-text hover:bg-gray-50"
						>
							<div className="flex items-center gap-2">
								{isFieldWeld && (
									<div title="Field Weld">
										<Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
									</div>
								)}
								<span className="text-sm font-medium">
									{isFieldWeld ? "Field Weld" : displayValue}
								</span>
							</div>

							{fieldWeldBadges && fieldWeldBadges.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{fieldWeldBadges}
								</div>
							)}
						</div>
					);

					// Wrap field welds in quick view, others in tooltip
					if (isFieldWeld) {
						return (
							<FieldWeldQuickView
								component={component}
								organizationSlug={organizationSlug}
								projectId={projectId}
							>
								{typeDisplay}
							</FieldWeldQuickView>
						);
					}

					return (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									{typeDisplay}
								</TooltipTrigger>
								<TooltipContent>
									<p>Component Type: {displayValue}</p>
									<p className="text-xs text-muted-foreground mt-1">
										Double-click to edit
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					);
				},
				size: 250,
				minSize: 180,
				maxSize: 350,
				enableSorting: true,
			},
			// Size
			{
				accessorKey: "size",
				header: "Size",
				cell: EditableCell,
				size: 80, // Reduced from 100
				enableSorting: true,
			},
			// Spec
			{
				accessorKey: "spec",
				header: "Spec",
				cell: EditableCell,
				size: 100, // Reduced from 120
				enableSorting: true,
			},
			// Material
			{
				accessorKey: "material",
				header: "Material",
				cell: EditableCell,
				size: 100, // Reduced from 130
				enableSorting: true,
			},
			// Area
			{
				accessorKey: "area",
				header: "Area",
				cell: EditableCell,
				size: 80, // Reduced from 100
				enableSorting: true,
			},
			// System
			{
				accessorKey: "system",
				header: "System",
				cell: EditableCell,
				size: 100, // Reduced from 120
				enableSorting: true,
			},
			// Test Package
			{
				accessorKey: "testPackage",
				header: "Test Pkg",
				cell: EditableCell,
				size: 100, // Reduced from 130
				enableSorting: true,
			},
			// Milestones Column - NEW
			{
				id: "milestones",
				header: "Milestones",
				cell: ({ row }) => {
					const component = row.original;
					const useInlineDiscreteMilestones =
						process.env
							.NEXT_PUBLIC_USE_INLINE_DISCRETE_MILESTONES ===
						"true";

					// Use inline pills for discrete milestones when feature flag is enabled
					if (
						useInlineDiscreteMilestones &&
						component.workflowType === "MILESTONE_DISCRETE"
					) {
						return (
							<InlineDiscreteMilestones
								component={component}
								className="min-w-[300px]"
							/>
						);
					}

					// Fallback to original component
					return (
						<DirectEditMilestoneColumn
							component={component}
							className="min-w-[250px]"
							expandedByDefault={false}
						/>
					);
				},
				size: 350, // Expanded width for milestone editing
				minSize: 250,
				maxSize: 500,
				enableSorting: false,
				enableResizing: true,
			},
			// Status
			{
				accessorKey: "status",
				header: "Status",
				cell: StatusCell,
				size: 130, // Reduced from 140
				enableSorting: true,
			},
			// Progress
			{
				accessorKey: "completionPercent",
				header: "Progress",
				cell: ProgressCell,
				size: 140, // Reduced from 160
				enableSorting: true,
			},
		],
		[],
	);

	// Apply new filters to data
	const filteredData = useMemo(() => {
		return applyComponentFileFilters(data, filters);
	}, [data, filters]);

	// Create table instance
	const table = useReactTable({
		data: filteredData,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			columnSizing,
			columnOrder,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onColumnSizingChange: setColumnSizing,
		onColumnOrderChange: setColumnOrder,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		columnResizeMode: "onChange",
		enableColumnResizing: true,
		enableRowSelection: true,
		getRowId: (row) => row.id, // Use component ID as row identifier
		meta: {
			updateData: async (
				rowIndex: number,
				columnId: string,
				value: any,
			) => {
				const component = filteredData[rowIndex];
				if (!component) return;

				try {
					// Call API to update component
					const response = await apiClient.pipetrak.components[
						":id"
					].$patch({
						param: { id: component.id },
					}, {
						[columnId]: value,
					});

					if (!response.ok) {
						throw new Error("Failed to update component");
					}

					// Update local state
					setData((old) =>
						old.map((row) => {
							if (row.id === component.id) {
								return {
									...row,
									[columnId]: value,
								};
							}
							return row;
						}),
					);

					toast.success("Component updated");
				} catch (error) {
					console.error("Error updating component:", error);
					toast.error("Failed to update component");
				}
			},
		},
	});

	// Handle export
	const handleExport = async () => {
		try {
			const headers = columns
				.filter((c) => c.id !== "select")
				.map((c) => c.header)
				.join(",");

			const rows = filteredData.map((component) =>
				columns
					.filter((c) => c.id !== "select")
					.map((col) => {
						const value =
							component[col.id as keyof ComponentWithMilestones];
						return typeof value === "string" && value.includes(",")
							? `"${value}"`
							: value?.toString() || "";
					})
					.join(","),
			);

			const csv = [headers, ...rows].join("\n");

			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `components-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
			a.click();
			URL.revokeObjectURL(url);

			toast.success("Components exported successfully");
		} catch (error) {
			console.error("Error exporting components:", error);
			toast.error("Failed to export components");
		}
	};

	// Handle refresh
	// Debug function to test API connectivity
	const testApiConnection = async () => {
		try {
			console.log("Testing API connection...");
			console.log("Base URL from utils:", getBaseUrl());

			// Test direct fetch first
			const testResponse = await fetch(
				`${getBaseUrl()}/api/pipetrak/components?projectId=${projectId}&limit=1`,
			);
			console.log(
				"Direct fetch test:",
				testResponse.status,
				testResponse.statusText,
			);

			if (testResponse.ok) {
				const testData = await testResponse.json();
				console.log("Direct fetch successful, data:", testData);
			}
		} catch (error) {
			console.error("Direct fetch failed:", error);
		}
	};

	const handleRefresh = async () => {
		startTransition(async () => {
			try {
				console.log("Refreshing components for project:", projectId);

				// Test connection first
				await testApiConnection();

				let response;
				try {
					response = await apiClient.pipetrak.components.$get({
						query: {
							projectId,
							limit: 10000, // Increase limit to fetch all components
						},
					});
				} catch (fetchError) {
					console.error("Fetch error during refresh:", fetchError);
					if (
						fetchError instanceof TypeError &&
						fetchError.message === "Failed to fetch"
					) {
						toast.error(
							"Network error: Cannot refresh components. Please check server connection.",
						);
						return;
					}
					throw fetchError;
				}

				if (!response.ok) {
					console.error(
						"Response not OK:",
						response.status,
						response.statusText,
					);
					throw new Error("Failed to fetch components");
				}

				const result = await response.json();

				// Transform the data to include drawingNumber for display (same as initial load)
				const transformedData = (result.data || []).map(
					(comp: any) => ({
						...comp,
						drawingNumber:
							comp.drawing?.number || comp.drawingId || "-",
						description:
							comp.description ||
							`${comp.type || ""} ${comp.spec || ""} ${comp.size || ""}`.trim() ||
							"-",
					}),
				);

				setData(transformedData);
				toast.success("Components refreshed");
			} catch (error) {
				console.error("Error refreshing components:", error);
				toast.error("Failed to refresh components");
			}
		});
	};

	// Handle bulk update
	const handleBulkUpdate = async () => {
		if (selectedComponents.length === 0) {
			toast.error("No components selected");
			return;
		}

		setShowBulkUpdateModal(true);
	};

	// Calculate statistics
	const stats = useMemo(() => {
		const total = filteredData.length;
		const notStarted = filteredData.filter(
			(c) => c.status === "NOT_STARTED",
		).length;
		const inProgress = filteredData.filter(
			(c) => c.status === "IN_PROGRESS",
		).length;
		const completed = filteredData.filter(
			(c) => c.status === "COMPLETED",
		).length;
		const avgProgress =
			filteredData.reduce(
				(sum, c) => sum + (c.completionPercent || 0),
				0,
			) / total || 0;

		// Field weld-specific statistics
		const fieldWelds = filteredData.filter((c) => c.type === "FIELD_WELD");
		const fieldWeldStats = {
			total: fieldWelds.length,
			withNDE: fieldWelds.filter((c) => c.fieldWelds?.[0]?.ndeResult)
				.length,
			ndeAccepted: fieldWelds.filter(
				(c) => c.fieldWelds?.[0]?.ndeResult?.toLowerCase() === "accept",
			).length,
			pwhtRequired: fieldWelds.filter(
				(c) => c.fieldWelds?.[0]?.pwhtRequired,
			).length,
			pwhtCompleted: fieldWelds.filter(
				(c) =>
					c.fieldWelds?.[0]?.pwhtRequired &&
					c.fieldWelds?.[0]?.datePwht,
			).length,
		};

		return {
			total,
			notStarted,
			inProgress,
			completed,
			avgProgress,
			fieldWeldStats,
		};
	}, [filteredData]);



	const handleDragEnd = () => {
		setDraggedColumn(null);
		setTargetColumn(null);
	};


	// Select All Filtered handler
	const selectAllFiltered = useCallback(() => {
		const newSelection: RowSelectionState = {};
		filteredData.forEach((component) => {
			newSelection[component.id] = true;
		});
		setRowSelection(newSelection);

		// Also update mobile selection if in mobile mode
		if (isMobile) {
			setMobileSelectedIds(new Set(filteredData.map((c) => c.id)));
		}

		toast.success(
			`Selected all ${filteredData.length} filtered components`,
		);
	}, [filteredData, isMobile]);

	// Clear all selections
	const clearAllSelections = useCallback(() => {
		setRowSelection({});
		setMobileSelectedIds(new Set());
		toast.success("Cleared all selections");
	}, []);

	// Get selected components with improved state synchronization
	const selectedComponents = useMemo(() => {
		if (isMobile) {
			return filteredData.filter((c) => mobileSelectedIds.has(c.id));
		}
		// More robust desktop selection calculation
		try {
			const selectedRows = table.getFilteredSelectedRowModel().rows;
			const selected = selectedRows.map((r) => r.original);

			// Fallback: If table selection seems inconsistent, use rowSelection state directly
			if (selected.length === 0 && Object.keys(rowSelection).length > 0) {
				return filteredData.filter((c) => rowSelection[c.id]);
			}

			return selected;
		} catch (error) {
			console.warn(
				"Table selection failed, falling back to rowSelection state:",
				error,
			);
			return filteredData.filter((c) => rowSelection[c.id]);
		}
	}, [isMobile, filteredData, mobileSelectedIds, table, rowSelection]);

	// Update selection count and debug selection state changes
	useEffect(() => {
		const currentCount = selectedComponents.length;
		setSelectionCount(currentCount);

		if (currentCount > 0) {
			console.log("Selection active:", {
				selectedCount: currentCount,
				isMobile,
				rowSelectionKeys: Object.keys(rowSelection),
				mobileSelectedCount: mobileSelectedIds.size,
				filteredDataCount: filteredData.length,
			});
		}
	}, [
		selectedComponents.length,
		isMobile,
		rowSelection,
		mobileSelectedIds.size,
		filteredData.length,
	]);

	// Bulk update handler
	const handleBulkUpdateSubmit = async (updates: any) => {
		try {
			// Get component IDs to update
			const componentIds = selectedComponents.map((c) => c.id);

			if (componentIds.length === 0) {
				toast.error("No components selected for update");
				return;
			}

			console.log("Starting bulk update with:", {
				componentIds,
				updates,
			});
			console.log("API base URL:", apiClient);

			// Call the bulk update API endpoint with better error handling
			let response;
			try {
				response = await apiClient.pipetrak.components[
					"bulk-update"
				].$post({
					json: {
						componentIds,
						updates,
						options: {
							atomic: true,
							validateOnly: false,
						},
					},
				});
			} catch (fetchError) {
				console.error("Fetch error details:", fetchError);
				console.error("Network error - check if API server is running");

				// Check if it's a network error
				if (
					fetchError instanceof TypeError &&
					fetchError.message === "Failed to fetch"
				) {
					toast.error(
						"Network error: Cannot connect to API server. Please check if the server is running.",
					);
					return;
				}
				throw fetchError;
			}

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Bulk update API error:", errorData);
				throw new Error(
					('message' in errorData ? errorData.message : undefined) || "Failed to update components",
				);
			}

			const result = await response.json();

			// Update local state with the actual updated components
			if (result.components && Array.isArray(result.components)) {
				setData((prev) => {
					const updatedComponentsMap = new Map(
						result.components.map((comp: any) => [comp.id, comp]),
					);

					return prev.map((c) => {
						const updated = updatedComponentsMap.get(c.id);
						if (updated) {
							return {
								...updated,
								drawingNumber:
									updated.drawing?.number ||
									updated.drawingId ||
									"-",
								description:
									updated.description ||
									`${updated.type || ""} ${updated.spec || ""} ${updated.size || ""}`.trim() ||
									"-",
							};
						}
						return c;
					});
				});
			}

			// Show success message
			const successful = ('successful' in result ? result.successful : undefined) || 0;
			const failed = ('failed' in result ? result.failed : undefined) || 0;
			if (failed === 0) {
				toast.success(
					`Successfully updated ${successful} component${successful !== 1 ? "s" : ""}`,
				);
			} else {
				toast.success(
					`Updated ${successful} components (${failed} failed)`,
				);
			}
		} catch (error) {
			console.error("Bulk update failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update components",
			);

			// Revert optimistic updates by refreshing data
			handleRefresh();
		}

		// Clear selections
		clearAllSelections();
	};

	// Handle milestone updates - defined at top level for both mobile and desktop
	const handleComponentMilestoneUpdate = useCallback(
		(componentId: string, updates: any) => {
			setData((prev) =>
				prev.map((c) =>
					c.id === componentId ? { ...c, ...updates } : c,
				),
			);
		},
		[],
	);

	// Group components by drawing number for all views
	const componentsByDrawing = useMemo(() => {
		const groups = new Map<string, ComponentWithMilestones[]>();

		filteredData.forEach((component) => {
			const drawingKey = component.drawingNumber || "NO_DRAWING";
			if (!groups.has(drawingKey)) {
				groups.set(drawingKey, []);
			}
			groups.get(drawingKey)!.push(component);
		});

		// Sort drawings alphabetically
		return new Map(
			[...groups.entries()].sort((a, b) => {
				// Put "NO_DRAWING" at the end
				if (a[0] === "NO_DRAWING") return 1;
				if (b[0] === "NO_DRAWING") return -1;
				return a[0].localeCompare(b[0]);
			}),
		);
	}, [filteredData]);

	// Mobile view with drawing groups
	if (isMobile) {
		const selectedComponents = filteredData.filter((c) =>
			mobileSelectedIds.has(c.id),
		);

		const toggleDrawing = (drawingNumber: string) => {
			const newExpanded = new Set(expandedDrawings);
			if (newExpanded.has(drawingNumber)) {
				newExpanded.delete(drawingNumber);
			} else {
				newExpanded.add(drawingNumber);
			}
			setExpandedDrawings(newExpanded);
		};

		const toggleAllDrawings = () => {
			if (expandedDrawings.size === componentsByDrawing.size) {
				// All expanded, collapse all
				setExpandedDrawings(new Set());
			} else {
				// Some or none expanded, expand all
				setExpandedDrawings(new Set(componentsByDrawing.keys()));
			}
		};

		const handleSelectAllInDrawing = (
			componentIds: string[],
			selected: boolean,
		) => {
			const newSelection = new Set(mobileSelectedIds);
			if (selected) {
				componentIds.forEach((id) => newSelection.add(id));
			} else {
				componentIds.forEach((id) => newSelection.delete(id));
			}
			setMobileSelectedIds(newSelection);
		};

		return (
			<RealtimeManager projectId={projectId} userId={userId}>
				<MilestoneUpdateEngine
					projectId={projectId}
					components={data}
					onComponentUpdate={handleComponentMilestoneUpdate}
				>
					<>
						<div className="space-y-4 pb-20 w-full px-4">
							{/* Mobile header with search and bulk actions */}
							<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4">
								<div className="space-y-3">
									<div className="flex gap-2">
										<div className="relative flex-1">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												placeholder="Search components..."
												value={globalFilter}
												onChange={(e) =>
													setGlobalFilter(
														e.target.value,
													)
												}
												className="pl-9"
											/>
										</div>
										<Button
											size="icon"
											variant="secondary"
											onClick={toggleAllDrawings}
											title={
												expandedDrawings.size ===
												componentsByDrawing.size
													? "Collapse All"
													: "Expand All"
											}
										>
											{expandedDrawings.size ===
											componentsByDrawing.size ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
										</Button>
									</div>

									{/* Bulk actions bar */}
									{mobileSelectedIds.size > 0 && (
										<div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
											<span className="text-sm font-medium">
												{mobileSelectedIds.size}{" "}
												selected
											</span>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														setMobileSelectedIds(
															new Set(),
														)
													}
												>
													Clear
												</Button>
												<Button
													size="sm"
													onClick={() =>
														setShowBulkUpdateModal(
															true,
														)
													}
												>
													Bulk Update
												</Button>
												<Button
													size="sm"
													variant="secondary"
													onClick={() =>
														setShowMilestoneModal(
															true,
														)
													}
												>
													Milestones
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Mobile stats */}
							<div className="grid grid-cols-3 gap-2">
								<Card>
									<CardContent className="p-3">
										<p className="text-xs text-muted-foreground">
											Drawings
										</p>
										<p className="text-lg font-bold">
											{componentsByDrawing.size}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-3">
										<p className="text-xs text-muted-foreground">
											Components
										</p>
										<p className="text-lg font-bold">
											{stats.total}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-3">
										<p className="text-xs text-muted-foreground">
											Complete
										</p>
										<p className="text-lg font-bold">
											{stats.completed}
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Drawing groups */}
							<div className="space-y-4">
								{Array.from(componentsByDrawing.entries()).map(
									([drawingNumber, components]) => (
										<MobileDrawingGroup
											key={drawingNumber}
											drawingNumber={
												drawingNumber === "NO_DRAWING"
													? ""
													: drawingNumber
											}
											components={components}
											isExpanded={expandedDrawings.has(
												drawingNumber,
											)}
											onToggleExpand={() =>
												toggleDrawing(drawingNumber)
											}
											selectedIds={mobileSelectedIds}
											onSelectComponent={(
												componentId,
												selected,
											) => {
												const newSelection = new Set(
													mobileSelectedIds,
												);
												if (selected) {
													newSelection.add(
														componentId,
													);
												} else {
													newSelection.delete(
														componentId,
													);
												}
												setMobileSelectedIds(
													newSelection,
												);
											}}
											onSelectAll={
												handleSelectAllInDrawing
											}
											onComponentClick={(componentId) => {
												// Prevent navigation if any modal is open
												if (
													mobileSheetOpen ||
													showMilestoneModal ||
													showBulkUpdateModal ||
													showBulkMilestoneModal
												) {
													return;
												}
												router.push(
													`/app/pipetrak/${projectId}/components/${componentId}`,
												);
											}}
											onQuickUpdate={(
												componentId,
												status,
											) => {
												setData((prev) =>
													prev.map((c) =>
														c.id === componentId
															? { ...c, status: status as ComponentStatus }
															: c,
													),
												);
												toast.success("Status updated");
											}}
											onEdit={(componentId) => {
												router.push(
													`/app/pipetrak/${projectId}/components/${componentId}/edit`,
												);
											}}
											onOpenMilestones={(componentId) => {
												const component = data.find(
													(c) => c.id === componentId,
												);
												if (component) {
													setSelectedMobileComponent(
														component,
													);
													setMobileSheetOpen(true);
												}
											}}
										/>
									),
								)}
							</div>

							{/* Mobile floating action button for filters */}
							<Button
								className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
								size="icon"
								onClick={() => {
									// TODO: Show filter modal
									toast.info("Filter modal coming soon");
								}}
							>
								<Filter className="h-6 w-6" />
							</Button>
						</div>

						{/* Bulk Update Modal */}
						<BulkUpdateModal
							isOpen={showBulkUpdateModal}
							onClose={() => setShowBulkUpdateModal(false)}
							selectedComponents={selectedComponents}
							onUpdate={handleBulkUpdateSubmit}
							projectId={projectId}
						/>

						{/* Milestone Update Modal */}
						<MilestoneUpdateModal
							components={selectedComponents}
							isOpen={showMilestoneModal}
							onClose={() => setShowMilestoneModal(false)}
							onUpdate={() => {
								// Refresh data after milestone updates
								handleRefresh();
							}}
							isMobile={isMobile}
						/>

						{/* Mobile Milestone Sheet for individual component milestones */}
						{selectedMobileComponent && (
							<MobileMilestoneSheet
								isOpen={mobileSheetOpen}
								onClose={() => {
									setMobileSheetOpen(false);
									setSelectedMobileComponent(null);
								}}
								component={selectedMobileComponent}
							/>
						)}
					</>
				</MilestoneUpdateEngine>
			</RealtimeManager>
		);
	}

	// Desktop view with full-screen support
	const tableContent = (
		<div
			className={cn(
				"space-y-4 md:space-y-6 lg:space-y-8",
				isFullScreen && "h-full flex flex-col",
			)}
		>
			{/* FilterBar Component - temporarily commented out */}
			{/* <FilterBar
				components={data}
				onFilterChange={setFilters}
				filteredCount={filteredData.length}
				totalCount={data.length}
			/> */}

			{/* Selection Tools and Actions */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{filteredData.length > 0 && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={selectAllFiltered}
							>
								Select All {filteredData.length}
							</Button>
							{(selectedComponents.length > 0 ||
								selectionCount > 0) && (
								<Button
									variant="outline"
									size="sm"
									onClick={clearAllSelections}
								>
									Clear Selection
								</Button>
							)}
						</>
					)}

					<Button
						variant="secondary"
						size="icon"
						onClick={handleRefresh}
						disabled={isPending}
					>
						<RefreshCw
							className={cn(
								"h-4 w-4",
								isPending && "animate-spin",
							)}
						/>
					</Button>
				</div>

				<div className="flex gap-2">
					{(selectedComponents.length > 0 || selectionCount > 0) && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={handleBulkUpdate}
							>
								Bulk Update (
								{selectedComponents.length || selectionCount})
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setShowBulkMilestoneModal(true)}
							>
								Update Milestones (
								{selectedComponents.length || selectionCount})
							</Button>
						</>
					)}

					{/* View Preset Switcher */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Settings className="mr-2 h-4 w-4" />
								{activePreset.name}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<div className="px-2 py-1.5 text-sm font-semibold">
								View Presets
							</div>
							{VIEW_PRESETS.map((preset) => {
								const Icon =
									preset.id === "field"
										? HardHat
										: preset.id === "technical"
											? Wrench
											: preset.id === "manager"
												? BarChart3
												: Table2;
								return (
									<DropdownMenuItem
										key={preset.id}
										onClick={() => {
											setActivePreset(preset);
											applyViewPreset(
												preset,
												setColumnVisibility,
												setColumnSizing,
												setColumnOrder,
											);
											toast.success(
												`Switched to ${preset.name}`,
											);
										}}
										className={cn(
											"cursor-pointer",
											activePreset.id === preset.id &&
												"bg-accent",
										)}
									>
										<Icon className="mr-2 h-4 w-4" />
										<div className="flex-1">
											<p className="font-medium">
												{preset.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{preset.description}
											</p>
										</div>
										{activePreset.id === preset.id && (
											<Check className="ml-2 h-4 w-4" />
										)}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Column visibility dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Columns className="mr-2 h-4 w-4" />
								Columns
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-2 py-1.5 text-sm font-semibold">
								Column Visibility
							</div>
							{table
								.getAllColumns()
								.filter(
									(column) =>
										column.getCanHide() &&
										![
											"select",
											"componentId",
											"instance",
										].includes(column.id),
								)
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id === "testPackage"
												? "Test Package"
												: column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
							<div className="border-t mt-2 pt-2">
								<DropdownMenuItem
									onClick={() => {
										// Reset all column sizes
										table.resetColumnSizing();
										localStorage.removeItem(
											"pipetrak-column-sizes",
										);
										toast.success(
											"Column widths reset to defaults",
										);
									}}
								>
									Reset Column Widths
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										// Reset column order
										setColumnOrder([]);
										localStorage.removeItem(
											"pipetrak-column-order",
										);
										toast.success(
											"Column order reset to defaults",
										);
									}}
								>
									Reset Column Order
								</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button variant="outline" size="sm" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={() =>
							router.push(`/app/pipetrak/${projectId}/import`)
						}
					>
						<Upload className="mr-2 h-4 w-4" />
						Import
					</Button>

					{/* QC Module Link - Show when field welds exist */}
					{data.some((c) => c.type === "FIELD_WELD") && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								const organizationSlug =
									typeof window !== "undefined"
										? window.location.pathname.split("/")[2]
										: "";
								router.push(
									`/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`,
								);
							}}
							className="border-orange-200 text-orange-700 hover:bg-orange-50"
						>
							<Zap className="mr-2 h-4 w-4 text-orange-500" />
							QC Module
						</Button>
					)}

					{/* Full-screen toggle */}
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setIsFullScreen(!isFullScreen)}
						title={
							isFullScreen
								? "Exit full-screen (Esc)"
								: "Full-screen (F)"
						}
					>
						{isFullScreen ? (
							<Minimize2 className="h-4 w-4" />
						) : (
							<Maximize2 className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Summary Stats - Hide in full-screen mode */}
			{!isFullScreen && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
						<CardContent className="p-4">
							<p className="text-sm text-blue-700 font-medium">
								Total Components
							</p>
							<p className="text-2xl font-bold text-blue-900">
								{stats.total}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
						<CardContent className="p-4">
							<p className="text-sm text-gray-700 font-medium">
								Not Started
							</p>
							<p className="text-2xl font-bold text-gray-800">
								{stats.notStarted}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
						<CardContent className="p-4">
							<p className="text-sm text-orange-700 font-medium">
								In Progress
							</p>
							<p className="text-2xl font-bold text-orange-900">
								{stats.inProgress}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
						<CardContent className="p-4">
							<p className="text-sm text-green-700 font-medium">
								Completed
							</p>
							<p className="text-2xl font-bold text-green-900">
								{stats.completed}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
						<CardContent className="p-4">
							<p className="text-sm text-purple-700 font-medium">
								Avg Progress
							</p>
							<p className="text-2xl font-bold text-purple-900">
								{Math.round(stats.avgProgress)}%
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Drawing Groups */}
			<div
				className={cn(
					"space-y-4",
					isFullScreen && "flex-1 overflow-auto",
				)}
			>
				{/* Expand/Collapse All */}
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">
						{componentsByDrawing.size} Drawing
						{componentsByDrawing.size !== 1 ? "s" : ""}
					</h3>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							if (
								expandedDrawings.size ===
								componentsByDrawing.size
							) {
								setExpandedDrawings(new Set());
							} else {
								setExpandedDrawings(
									new Set(componentsByDrawing.keys()),
								);
							}
						}}
					>
						{expandedDrawings.size === componentsByDrawing.size ? (
							<>
								<ChevronUp className="h-4 w-4 mr-2" />
								Collapse All
							</>
						) : (
							<>
								<ChevronDown className="h-4 w-4 mr-2" />
								Expand All
							</>
						)}
					</Button>
				</div>

				{/* Drawing groups - single column layout for better tablet readability */}
				<div className="grid grid-cols-1 gap-6 md:gap-8">
					{Array.from(componentsByDrawing.entries()).map(
						([drawingNumber, components]) => (
							<DrawingGroup
								key={drawingNumber}
								drawingNumber={
									drawingNumber === "NO_DRAWING"
										? ""
										: drawingNumber
								}
								components={components}
								isExpanded={expandedDrawings.has(drawingNumber)}
								onToggleExpand={() => {
									const newExpanded = new Set(
										expandedDrawings,
									);
									if (newExpanded.has(drawingNumber)) {
										newExpanded.delete(drawingNumber);
									} else {
										newExpanded.add(drawingNumber);
									}
									setExpandedDrawings(newExpanded);
								}}
								columns={columns}
								columnOrder={columnOrder}
								columnSizing={columnSizing}
								columnVisibility={columnVisibility}
								rowSelection={rowSelection}
								onRowSelectionChange={(
									componentIds,
									selected,
								) => {
									setRowSelection((prev) => {
										const newSelection = { ...prev };
										if (selected) {
											componentIds.forEach((id) => {
												newSelection[id] = true;
											});
										} else {
											componentIds.forEach((id) => {
												delete newSelection[id];
											});
										}
										return newSelection;
									});
								}}
								onComponentUpdate={(
									componentId,
									field,
									value,
								) => {
									setData((prev) =>
										prev.map((c) =>
											c.id === componentId
												? { ...c, [field]: value }
												: c,
										),
									);
								}}
								onColumnSizingChange={setColumnSizing}
								draggedColumn={draggedColumn}
								targetColumn={targetColumn}
								onDragStart={setDraggedColumn}
								onDragOver={setTargetColumn}
								onDragEnd={handleDragEnd}
							/>
						),
					)}
				</div>
			</div>
		</div>
	);

	// If full-screen, render with portal-like behavior
	if (isFullScreen) {
		return (
			<div
				ref={fullScreenContainerRef}
				className="fixed inset-0 z-50 bg-white flex flex-col"
			>
				{/* Full-screen header */}
				<div className="flex items-center justify-between p-4 border-b bg-gray-50">
					<h2 className="text-lg font-semibold">
						Component Table - Full Screen
					</h2>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setIsFullScreen(false)}
						className="gap-2"
					>
						<Minimize2 className="h-4 w-4" />
						Exit Full Screen (Esc)
					</Button>
				</div>
				{/* Table content fills remaining space - with scroll */}
				<div className="flex-1 overflow-auto p-4">{tableContent}</div>
			</div>
		);
	}

	// Normal view - wrap with milestone management
	return (
		<RealtimeManager projectId={projectId} userId={userId}>
			<MilestoneUpdateEngine
				projectId={projectId}
				components={data}
				onComponentUpdate={handleComponentMilestoneUpdate}
			>
				<>
					<Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
						<CardContent className="p-4 md:p-6 lg:p-8">
							{tableContent}
						</CardContent>
					</Card>

					{/* Bulk Update Modal for desktop */}
					<BulkUpdateModal
						isOpen={showBulkUpdateModal}
						onClose={() => setShowBulkUpdateModal(false)}
						selectedComponents={selectedComponents}
						onUpdate={handleBulkUpdateSubmit}
						projectId={projectId}
					/>

					{/* New Bulk Milestone Modal for desktop */}
					<BulkMilestoneModal
						selectedComponents={selectedComponents}
						isOpen={showBulkMilestoneModal}
						onClose={() => setShowBulkMilestoneModal(false)}
						projectId={projectId}
						onBulkUpdate={async (updates) => {
							try {
								// Create bulk update service with progress tracking
								const service = createBulkUpdateService(
									(progress) => {
										console.log(
											`Bulk update progress: ${progress.percentage}% - ${progress.message}`,
										);
									},
								);

								// Log the updates structure for debugging
								console.log("Bulk update request:", updates);

								// The updates object should already have the correct structure from BulkMilestoneModal
								// It should contain: mode, projectId, and either milestoneName+componentIds or groups
								let result;

								if (!updates.mode) {
									throw new Error("Update mode is required");
								}

								if (!updates.projectId) {
									updates.projectId = projectId;
								}

								// Execute the bulk update with the properly structured request
								result =
									await service.performBulkUpdate(updates);

								// Validate results before proceeding
								if (!result || typeof result !== "object") {
									throw new Error(
										"Invalid response from bulk update service",
									);
								}

								const {
									successful = [],
									failed = [],
									total = 0,
								} = result;

								// Log results for debugging
								console.log(
									`Bulk update completed: ${successful.length} successful, ${failed.length} failed out of ${total} total`,
								);

								// Show appropriate feedback
								if (failed.length === 0) {
									toast.success(
										`Successfully updated ${successful.length} component${successful.length !== 1 ? "s" : ""}`,
									);
								} else if (successful.length === 0) {
									toast.error(
										`Failed to update all ${total} components`,
									);
									if (failed.length > 0 && failed[0].error) {
										console.error(
											"First failure reason:",
											failed[0].error,
										);
									}
								} else {
									toast.warning(
										`Updated ${successful.length} of ${total} components. ${failed.length} failed.`,
									);
								}

								// Only refresh data if we had some successful updates
								if (successful.length > 0) {
									// Wait longer for the database transaction to fully commit and replicate
									await new Promise((resolve) =>
										setTimeout(resolve, 1000),
									);
									handleRefresh();
								} else if (failed.length > 0) {
									// For debugging - log the first few failures
									console.error(
										"Bulk update failures:",
										failed.slice(0, 3),
									);
								}

								return result;
							} catch (error) {
								console.error("Bulk update failed:", error);
								toast.error(
									error instanceof Error
										? error.message
										: "Failed to update components",
								);
								throw error;
							}
						}}
					/>
				</>
			</MilestoneUpdateEngine>
		</RealtimeManager>
	);
}
