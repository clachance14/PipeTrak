"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	Download,
	Loader2,
	Plus,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddWeldModal } from "./AddWeldModal";
import {
	type ColumnConfig,
	ColumnToggle,
	createDefaultColumns,
	loadColumnConfig,
	saveColumnConfig,
} from "./ColumnToggle";
import { MarkWeldCompleteModal } from "./MarkWeldCompleteModal";
import { MobileQCView } from "./MobileQCView";

// Cell components to avoid hooks-in-cell issues
interface NDETypeCellProps {
	row: any;
	setData: any;
	updateFieldWeldNDE: any;
}

function NDETypeCell({ row, setData, updateFieldWeldNDE }: NDETypeCellProps) {
	const [isUpdating, setIsUpdating] = useState(false);

	// Handle ndeTypes array properly - get first element or default to 'None'
	const ndeTypesArray = (row.original as any).ndeTypes || [];
	const value = ndeTypesArray.length > 0 ? ndeTypesArray[0] : "None";

	const handleChange = async (newValue: string) => {
		setIsUpdating(true);
		try {
			const response = await updateFieldWeldNDE(row.original.id, {
				ndeType: newValue,
				ndeDate: new Date().toISOString(),
			});

			// Update the data with the response from the backend
			if (response.fieldWeld) {
				const newNdeTypesArray = response.fieldWeld.ndeTypes || [];

				setData((prev: any) => {
					const updated = prev.map((item: any) =>
						item.id === row.original.id
							? ({
									...item,
									ndeTypes: newNdeTypesArray,
									ndeResult: response.fieldWeld.ndeResult,
									ndeDate: response.fieldWeld.ndeDate,
									updatedAt: response.fieldWeld.updatedAt,
								} as any)
							: item,
					);
					return updated;
				});
			} else {
				// Fallback to manual update if no response data
				const newNdeTypesArray = newValue === "None" ? [] : [newValue];
				setData((prev: any) =>
					prev.map((item: any) =>
						item.id === row.original.id
							? ({
									...item,
									ndeTypes: newNdeTypesArray,
									ndeDate: new Date().toISOString(),
								} as any)
							: item,
					),
				);
			}
		} catch (error) {
			console.error("Failed to update NDE type:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Select
				value={value}
				onValueChange={handleChange}
				disabled={isUpdating}
			>
				<SelectTrigger className="h-8 w-20 text-xs">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="None">None</SelectItem>
					<SelectItem value="Visual">Visual</SelectItem>
					<SelectItem value="RT">RT</SelectItem>
					<SelectItem value="UT">UT</SelectItem>
					<SelectItem value="MT">MT</SelectItem>
					<SelectItem value="PT">PT</SelectItem>
				</SelectContent>
			</Select>
			{isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
		</div>
	);
}

interface NDEResultCellProps {
	row: any;
	setData: any;
	updateFieldWeldNDE: any;
}

function NDEResultCell({
	row,
	setData,
	updateFieldWeldNDE,
}: NDEResultCellProps) {
	const [isUpdating, setIsUpdating] = useState(false);
	const value = row.original.ndeResult;

	// Get NDE type from ndeTypes array
	const ndeTypesArray = (row.original as any).ndeTypes || [];
	const ndeType = ndeTypesArray.length > 0 ? ndeTypesArray[0] : null;
	const canEdit = ndeType && ndeType !== "None";

	const handleChange = async (newValue: string) => {
		setIsUpdating(true);
		try {
			const response = await updateFieldWeldNDE(row.original.id, {
				ndeResult: newValue,
				ndeDate: new Date().toISOString(),
			});

			// Update the data with the response from the backend
			if (response.fieldWeld) {
				setData((prev: any) => {
					const updated = prev.map((item: any) =>
						item.id === row.original.id
							? ({
									...item,
									ndeResult: response.fieldWeld.ndeResult,
									ndeTypes: response.fieldWeld.ndeTypes,
									ndeDate: response.fieldWeld.ndeDate,
									updatedAt: response.fieldWeld.updatedAt,
									// Update component milestones if they exist in the response
									component:
										response.fieldWeld.component ||
										item.component,
								} as any)
							: item,
					);
					return updated;
				});
			} else {
				// Fallback to manual update if no response data
				setData((prev: any) =>
					prev.map((item: any) =>
						item.id === row.original.id
							? {
									...item,
									ndeResult: newValue as "Accept" | "Reject",
								}
							: item,
					),
				);
			}

			// Handle Accept logic
			if (newValue === "Accept") {
				// Logic handled by backend
			}

			// Handle Reject logic (placeholder for future implementation)
			if (newValue === "Reject") {
				// TODO: Future implementation
				// - Create NCR (Non-Conformance Report)
				// - Notify responsible parties
				// - Track repair requirements
				// - Reset weld milestone
			}
		} catch (_error) {
			// Error handled silently
		} finally {
			setIsUpdating(false);
		}
	};

	if (!canEdit) {
		return (
			<Badge status="info" className="text-muted-foreground">
				-
			</Badge>
		);
	}

	if (!value) {
		return (
			<Select onValueChange={handleChange} disabled={isUpdating}>
				<SelectTrigger className="w-[100px] h-8 border-dashed">
					<SelectValue placeholder="Select..." />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="Accept">
						<span className="flex items-center gap-2">
							<Check className="h-4 w-4 text-green-600" />
							Accept
						</span>
					</SelectItem>
					<SelectItem value="Reject">
						<span className="flex items-center gap-2">
							<XCircle className="h-4 w-4 text-red-600" />
							Reject
						</span>
					</SelectItem>
				</SelectContent>
			</Select>
		);
	}

	// Show selected value as badge
	return (
		<div className="flex items-center gap-2">
			<Badge
				variant={value === "Accept" ? "default" : "destructive"}
				className={cn(
					"cursor-pointer",
					value === "Accept" &&
						"bg-green-100 text-green-800 border-green-300",
					value === "Reject" &&
						"bg-red-100 text-red-800 border-red-300",
				)}
			>
				{value === "Accept" ? (
					<Check className="h-3 w-3 mr-1" />
				) : (
					<XCircle className="h-3 w-3 mr-1" />
				)}
				{value}
			</Badge>
			{isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
		</div>
	);
}

// Types based on our API response
interface FieldWeldData {
	id: string;
	weldIdNumber: string;
	dateWelded?: string;
	weldSize: string;
	schedule: string;
	ndeType?: "Visual" | "RT" | "UT" | "MT" | "PT" | "None";
	ndeResult?: "Accept" | "Reject";
	ndeDate?: string;
	ndeInspector?: string;
	pwhtRequired: boolean;
	datePwht?: string;
	comments?: string;
	packageNumber: string;
	welder?: {
		id: string;
		stencil: string;
		name: string;
	};
	drawing: {
		id: string;
		number: string;
		title: string;
	};
	weldType: {
		code: string;
		description: string;
	};
	component?: {
		id: string;
		componentId: string;
		displayId: string;
		area: string;
		system: string;
		testPackage: string;
		status: string;
		completionPercent: number;
		milestones: Array<{
			id: string;
			milestoneName: string;
			isCompleted: boolean;
			completedAt?: string;
			completedBy?: string;
			milestoneOrder: number;
			weight: number;
		}>;
	};
}

interface FieldWeldTableProps {
	projectId: string;
	organizationSlug: string;
}

export function FieldWeldTable({
	projectId,
	organizationSlug,
}: FieldWeldTableProps) {
	const [data, setData] = useState<FieldWeldData[]>([]);
	const [loading, setLoading] = useState(false);

	// Function to update NDE data
	const updateFieldWeldNDE = async (
		fieldWeldId: string,
		ndeData: {
			ndeType?: string;
			ndeResult?: string;
			ndeDate?: string;
		},
	) => {
		const response = await fetch(
			`/api/pipetrak/field-welds/${fieldWeldId}/nde`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(ndeData),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Failed to update NDE data: ${response.status} ${errorText}`,
			);
		}

		const responseData = await response.json();
		return responseData;
	};
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedWeld, setSelectedWeld] = useState<FieldWeldData | null>(
		null,
	);
	const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// New filtering state
	const [_weldFilters, _setWeldFilters] = useState<any>({
		// WeldFilterState type not defined
		packageNumber: "all",
		drawing: "all",
		area: "all",
		system: "all",
		welder: "all",
		weldStatus: "all",
		ndeResult: "all",
		pwhtStatus: "all",
		weldType: "all",
		weldSize: "all",
		schedule: "all",
		dateWeldedFrom: "",
		dateWeldedTo: "",
		datePwhtFrom: "",
		datePwhtTo: "",
		search: "",
	});

	// Column configuration state - initialize with defaults to prevent hydration mismatch
	const [columnConfig, setColumnConfig] =
		useState<ColumnConfig[]>(createDefaultColumns);

	// Load saved column configuration after hydration
	useEffect(() => {
		const savedConfig = loadColumnConfig(createDefaultColumns());
		setColumnConfig(savedConfig);
	}, []);

	// Detect mobile viewport
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Natural sorting function for weld IDs
	const naturalSort = (a: any, b: any): number => {
		const aVal = a.getValue();
		const bVal = b.getValue();

		// Extract numeric parts for comparison
		const aNum = aVal.match(/\d+/g)?.map(Number) || [0];
		const bNum = bVal.match(/\d+/g)?.map(Number) || [0];

		// Compare each numeric part
		for (let i = 0; i < Math.max(aNum.length, bNum.length); i++) {
			const aDigit = aNum[i] || 0;
			const bDigit = bNum[i] || 0;

			if (aDigit !== bDigit) {
				return aDigit - bDigit;
			}
		}

		// If all numeric parts are equal, fall back to string comparison
		return aVal.localeCompare(bVal);
	};

	// Apply filters using the custom hook
	// Temporarily use basic filtering until useWeldFilters is implemented
	const filteredWelds = data; // TODO: implement proper filtering
	const filterStats = {
		complete: 0,
		pending: 0,
		ndePending: 0,
		ndeAccept: 0,
		ndeReject: 0,
		pwhtRequired: 0,
		pwhtComplete: 0,
	}; // TODO: implement filter stats

	// Column definitions with sort indicators
	const columns = useMemo<ColumnDef<FieldWeldData>[]>(
		() => [
			{
				accessorKey: "weldIdNumber",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
							className="h-auto p-0 font-medium hover:bg-transparent"
						>
							Weld ID
							{isSorted === "asc" ? (
								<ArrowUp className="ml-2 h-4 w-4" />
							) : isSorted === "desc" ? (
								<ArrowDown className="ml-2 h-4 w-4" />
							) : (
								<ArrowUpDown className="ml-2 h-4 w-4" />
							)}
						</Button>
					);
				},
				cell: ({ row }) => (
					<div className="font-medium">
						{row.original.weldIdNumber}
					</div>
				),
				sortingFn: naturalSort,
			},
			{
				accessorKey: "packageNumber",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
							className="h-auto p-0 font-medium hover:bg-transparent"
						>
							Package
							{isSorted === "asc" ? (
								<ArrowUp className="ml-2 h-4 w-4" />
							) : isSorted === "desc" ? (
								<ArrowDown className="ml-2 h-4 w-4" />
							) : (
								<ArrowUpDown className="ml-2 h-4 w-4" />
							)}
						</Button>
					);
				},
				cell: ({ row }) => {
					const packageNumber = row.original.packageNumber;
					if (
						!packageNumber ||
						packageNumber === "TBD" ||
						packageNumber.trim() === ""
					) {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}
					return <Badge status="info">{packageNumber}</Badge>;
				},
			},
			{
				accessorKey: "drawing.number",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
							className="h-auto p-0 font-medium hover:bg-transparent"
						>
							Drawing
							{isSorted === "asc" ? (
								<ArrowUp className="ml-2 h-4 w-4" />
							) : isSorted === "desc" ? (
								<ArrowDown className="ml-2 h-4 w-4" />
							) : (
								<ArrowUpDown className="ml-2 h-4 w-4" />
							)}
						</Button>
					);
				},
				cell: ({ row }) => {
					const drawing = row.original.drawing;
					return (
						<div className="text-sm font-medium">
							{drawing.number || "-"}
						</div>
					);
				},
			},
			{
				accessorKey: "component.area",
				header: "Area",
				cell: ({ row }) => {
					const area = row.original.component?.area;
					if (!area || area.trim() === "") {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}
					return <Badge status="info">{area}</Badge>;
				},
			},
			{
				accessorKey: "component.system",
				header: "System",
				cell: ({ row }) => {
					const system = row.original.component?.system;
					if (!system || system.trim() === "") {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}
					return <Badge status="info">{system}</Badge>;
				},
			},
			{
				accessorKey: "welder.stencil",
				header: "Welder",
				cell: ({ row }) => (
					<div className="text-sm">
						{row.original.welder ? (
							<>
								<div className="font-medium">
									{row.original.welder.stencil}
								</div>
								<div className="text-muted-foreground">
									{row.original.welder.name}
								</div>
							</>
						) : (
							<span className="text-muted-foreground">-</span>
						)}
					</div>
				),
			},
			{
				accessorKey: "dateWelded",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
							className="h-auto p-0 font-medium hover:bg-transparent"
						>
							Date Welded
							{isSorted === "asc" ? (
								<ArrowUp className="ml-2 h-4 w-4" />
							) : isSorted === "desc" ? (
								<ArrowDown className="ml-2 h-4 w-4" />
							) : (
								<ArrowUpDown className="ml-2 h-4 w-4" />
							)}
						</Button>
					);
				},
				cell: ({ row }) => {
					const dateWelded = row.original.dateWelded;
					if (!dateWelded) {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}
					return (
						<div className="text-sm">
							{new Date(dateWelded).toLocaleDateString()}
						</div>
					);
				},
			},
			{
				accessorKey: "weldSize",
				header: "Size",
				cell: ({ row }) => {
					const weldSize = row.original.weldSize;
					const schedule = row.original.schedule;

					if (!weldSize && !schedule) {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}

					return (
						<div className="text-sm">
							<div>{weldSize || "-"}</div>
							<div className="text-muted-foreground">
								{schedule ? `Sch ${schedule}` : "-"}
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "ndeType",
				header: "NDE Type",
				cell: ({ row }) => (
					<NDETypeCell
						row={row}
						setData={setData}
						updateFieldWeldNDE={updateFieldWeldNDE}
					/>
				),
			},
			{
				accessorKey: "ndeResult",
				header: "NDE Result",
				cell: ({ row }) => (
					<NDEResultCell
						row={row}
						setData={setData}
						updateFieldWeldNDE={updateFieldWeldNDE}
					/>
				),
			},
			{
				accessorKey: "pwhtRequired",
				header: "PWHT",
				cell: ({ row }) => {
					const required = row.original.pwhtRequired;
					const completed = row.original.datePwht;

					if (!required) {
						return (
							<div className="text-sm text-muted-foreground">
								-
							</div>
						);
					}

					return (
						<Badge status={completed ? "success" : "info"}>
							{completed ? "Complete" : "Required"}
						</Badge>
					);
				},
			},
			{
				id: "weldStatus",
				header: "Weld Status",
				cell: ({ row }) => {
					const milestones = row.original.component?.milestones || [];
					const fitUpMilestone = milestones.find(
						(m) => m.milestoneName === "Fit Up",
					);
					const weldMilestone = milestones.find(
						(m) => m.milestoneName === "Weld Made",
					);

					// Determine status based on milestone completion
					if (weldMilestone?.isCompleted) {
						return (
							<Badge
								status="info"
								className="bg-green-100 text-green-800 border-green-200"
							>
								Complete
							</Badge>
						);
					}
					if (fitUpMilestone?.isCompleted) {
						return (
							<Badge
								variant="outline"
								className="bg-yellow-100 text-yellow-700 border-yellow-200"
							>
								Pending
							</Badge>
						);
					}

					// Shouldn't reach here if API filters correctly, but fallback
					return (
						<Badge
							status="info"
							className="bg-gray-50 text-gray-500 border-gray-200"
						>
							Unknown
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const weld = row.original;
					const milestones = weld.component?.milestones || [];
					const fitUpMilestone = milestones.find(
						(m) => m.milestoneName === "Fit Up",
					);
					const weldMilestone = milestones.find(
						(m) => m.milestoneName === "Weld Made",
					);

					// Only show Mark Complete if fit-up is done but weld is not
					if (
						fitUpMilestone?.isCompleted &&
						!weldMilestone?.isCompleted
					) {
						return (
							<Button
								size="sm"
								variant="outline"
								className="h-8 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									setSelectedWeld(weld);
									setShowMarkCompleteModal(true);
								}}
							>
								<Check className="h-4 w-4 mr-2" />
								Mark Complete
							</Button>
						);
					}

					return (
						<div className="text-sm text-muted-foreground">-</div>
					);
				},
			},
		],
		[],
	);

	const table = useReactTable({
		data: filteredWelds,
		columns: columns.filter((col) => {
			const config = columnConfig.find(
				(c) =>
					c.key === col.id ||
					(col as any).accessorKey?.includes?.(c.key),
			);
			return config?.visible !== false;
		}),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
	});

	// Fetch data
	const fetchFieldWelds = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/pipetrak/field-welds?projectId=${projectId}`,
			);

			if (response.ok) {
				const result = await response.json();

				// Transform ndeTypes array to ndeType string for frontend compatibility
				const transformedFieldWelds = (result.fieldWelds || []).map(
					(weld: any) => {
						const transformed = {
							...weld,
							ndeType: weld.ndeTypes?.[0] || null, // Convert array to single string
						};

						return transformed;
					},
				);

				setData(transformedFieldWelds);
			}
		} catch (_error) {
			// Error handled silently
		} finally {
			setLoading(false);
		}
	};

	// Load data on mount
	useEffect(() => {
		fetchFieldWelds();
	}, [projectId]);

	// Column configuration handlers
	const handleColumnVisibilityChange = (
		columnKey: string,
		visible: boolean,
	) => {
		const newConfig = columnConfig.map((col) =>
			col.key === columnKey ? { ...col, visible } : col,
		);
		setColumnConfig(newConfig);
		saveColumnConfig(newConfig);
	};

	const handleColumnPinChange = (columnKey: string, pinned: boolean) => {
		const newConfig = columnConfig.map((col) =>
			col.key === columnKey ? { ...col, pinned } : col,
		);
		setColumnConfig(newConfig);
		saveColumnConfig(newConfig);
	};

	const handleResetColumns = () => {
		const defaultColumns = createDefaultColumns();
		setColumnConfig(defaultColumns);
		saveColumnConfig(defaultColumns);
	};

	const handleAddWeld = () => {
		setShowAddModal(true);
	};

	const handleAddWeldSuccess = () => {
		fetchFieldWelds(); // Refresh data
	};

	const handleMarkCompleteSuccess = () => {
		fetchFieldWelds(); // Refresh data
		setSelectedWeld(null);
	};

	const handleImportWelds = () => {
		// Will implement import functionality
		console.log("Import welds clicked");
	};

	// Use mobile view on small screens
	if (isMobile) {
		return (
			<MobileQCView
				projectId={projectId}
				organizationSlug={organizationSlug}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{/* Enhanced Filter Bar - temporarily commented out */}
			{/* <WeldFilterBar
        fieldWelds={data}
        onFilterChange={setWeldFilters}
        filteredCount={filteredWelds.length}
        totalCount={data.length}
      /> */}

			{/* Toolbar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<ColumnToggle
						columns={columnConfig}
						onColumnVisibilityChange={handleColumnVisibilityChange}
						onColumnPinChange={handleColumnPinChange}
						onResetColumns={handleResetColumns}
					/>

					{filterStats && (
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<Badge status="info" className="text-xs">
								Complete: {filterStats.complete}
							</Badge>
							<Badge status="info" className="text-xs">
								Pending: {filterStats.pending}
							</Badge>
							<Badge status="info" className="text-xs">
								NDE Pending: {filterStats.ndePending}
							</Badge>
						</div>
					)}
				</div>

				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchFieldWelds}
						disabled={loading}
					>
						<RefreshCw
							className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
						/>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleImportWelds}
					>
						<Download className="h-4 w-4 mr-2" />
						Import
					</Button>
					<Button size="sm" onClick={handleAddWeld}>
						<Plus className="h-4 w-4 mr-2" />
						Add Weld
					</Button>
				</div>
			</div>

			{/* Table */}
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={
											row.getIsSelected() && "selected"
										}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => {
											// Navigate to field weld details or open edit modal
											console.log(
												"Row clicked:",
												row.original,
											);
										}}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={table.getAllColumns().length}
										className="h-24 text-center"
									>
										{loading
											? "Loading..."
											: "No field welds found."}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Enhanced Summary */}
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<div>
					Showing {table.getFilteredRowModel().rows.length} of{" "}
					{data.length} field welds
				</div>

				{filterStats && (
					<div className="flex items-center space-x-4">
						<span>Complete: {filterStats.complete}</span>
						<span>NDE Accept: {filterStats.ndeAccept}</span>
						<span>NDE Reject: {filterStats.ndeReject}</span>
						<span>
							PWHT Required:{" "}
							{filterStats.pwhtRequired -
								filterStats.pwhtComplete}
						</span>
					</div>
				)}
			</div>

			{/* Add Weld Modal */}
			<AddWeldModal
				open={showAddModal}
				onOpenChange={setShowAddModal}
				projectId={projectId}
				onSuccess={handleAddWeldSuccess}
			/>

			{/* Mark Weld Complete Modal */}
			{selectedWeld && (
				<MarkWeldCompleteModal
					open={showMarkCompleteModal}
					onOpenChange={setShowMarkCompleteModal}
					fieldWeld={{
						id: selectedWeld.id,
						weldIdNumber: selectedWeld.weldIdNumber,
						projectId,
					}}
					onSuccess={handleMarkCompleteSuccess}
				/>
			)}
		</div>
	);
}
