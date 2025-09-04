"use client";

import { useState, useMemo, useRef } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	flexRender,
	type ColumnDef,
	type SortingState,
	type VisibilityState,
	type RowSelectionState,
	type ColumnSizingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardHeader } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Checkbox } from "@ui/components/checkbox";
import {
	MapPin,
	Package,
	Check,
	AlertCircle,
	Clock,
	// @ts-ignore - Minus exists at runtime but TypeScript declarations are incomplete
	Minus,
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface DrawingGroupProps {
	drawingNumber: string;
	components: ComponentWithMilestones[];
	isExpanded: boolean;
	onToggleExpand: () => void;
	columns: ColumnDef<ComponentWithMilestones>[];
	columnOrder: string[];
	columnSizing: ColumnSizingState;
	columnVisibility: VisibilityState;
	rowSelection: RowSelectionState;
	onRowSelectionChange: (componentIds: string[], selected: boolean) => void;
	onComponentUpdate: (componentId: string, field: string, value: any) => void;
	onColumnSizingChange: (sizing: ColumnSizingState) => void;
	draggedColumn: string | null;
	targetColumn: string | null;
	onDragStart: (columnId: string) => void;
	onDragOver: (columnId: string) => void;
	onDragEnd: () => void;
}

export function DrawingGroup({
	drawingNumber,
	components,
	isExpanded,
	onToggleExpand,
	columns,
	columnOrder,
	columnSizing,
	columnVisibility,
	rowSelection,
	onRowSelectionChange,
	onComponentUpdate,
	onColumnSizingChange,
	draggedColumn: _draggedColumn,
	targetColumn,
	onDragStart,
	onDragOver,
	onDragEnd,
}: DrawingGroupProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const tableContainerRef = useRef<HTMLDivElement>(null);

	// Calculate drawing-level statistics
	const stats = useMemo(() => {
		const total = components.length;
		const completed = components.filter(
			(c) => c.status === "COMPLETED",
		).length;
		const inProgress = components.filter(
			(c) => c.status === "IN_PROGRESS",
		).length;
		const notStarted = components.filter(
			(c) => c.status === "NOT_STARTED",
		).length;

		const totalProgress = components.reduce(
			(sum, c) => sum + (c.completionPercent || 0),
			0,
		);
		const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

		const selectedInGroup = components.filter(
			(c) => rowSelection[c.id],
		).length;
		const allSelected = selectedInGroup === total && total > 0;
		const someSelected = selectedInGroup > 0 && selectedInGroup < total;

		return {
			total,
			completed,
			inProgress,
			notStarted,
			avgProgress,
			selectedInGroup,
			allSelected,
			someSelected,
		};
	}, [components, rowSelection]);

	// Filter out the drawingNumber column since it's redundant in the group
	const filteredColumns = useMemo(() => {
		return columns.filter((col) => col.id !== "drawingNumber");
	}, [columns]);

	// Map global selection (by component ID) to local selection state
	const localRowSelection = useMemo(() => {
		const localSelection: RowSelectionState = {};
		components.forEach((component) => {
			if (rowSelection[component.id]) {
				localSelection[component.id] = true;
			}
		});
		return localSelection;
	}, [rowSelection, components]);

	// Handle individual row selection changes
	const handleLocalRowSelectionChange = (
		updaterOrState:
			| RowSelectionState
			| ((old: RowSelectionState) => RowSelectionState),
	) => {
		// Handle both function and object forms of state updates
		const newSelection =
			typeof updaterOrState === "function"
				? updaterOrState(localRowSelection)
				: updaterOrState;

		const changedComponents: { id: string; selected: boolean }[] = [];

		// Find all components where selection state changed by component ID
		components.forEach((component) => {
			const componentId = component.id;
			const isCurrentlySelected = !!localRowSelection[componentId];
			const willBeSelected = !!newSelection[componentId];

			// If the selection state changed for this component
			if (isCurrentlySelected !== willBeSelected) {
				changedComponents.push({
					id: componentId,
					selected: willBeSelected,
				});
			}
		});

		// Batch the changes by selection state
		const selectedIds = changedComponents
			.filter((c) => c.selected)
			.map((c) => c.id);
		const deselectedIds = changedComponents
			.filter((c) => !c.selected)
			.map((c) => c.id);

		// Make the calls to update selection
		if (selectedIds.length > 0) {
			onRowSelectionChange(selectedIds, true);
		}
		if (deselectedIds.length > 0) {
			onRowSelectionChange(deselectedIds, false);
		}
	};

	// Create table instance for this drawing group
	const table = useReactTable({
		data: components,
		columns: filteredColumns,
		state: {
			sorting,
			columnVisibility,
			rowSelection: localRowSelection,
			columnSizing,
			columnOrder: columnOrder.filter((id) => id !== "drawingNumber"),
		},
		onSortingChange: setSorting,
		onRowSelectionChange: handleLocalRowSelectionChange,
		onColumnSizingChange: (updater) => {
			const newSizing = typeof updater === 'function' ? updater(columnSizing) : updater;
			onColumnSizingChange(newSizing);
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: true,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		getRowId: (row) => row.id, // Use component ID as row identifier
		meta: {
			updateData: (rowIndex: number, columnId: string, value: any) => {
				const component = components[rowIndex];
				if (component) {
					onComponentUpdate(component.id, columnId, value);
				}
			},
		},
	});

	// Virtual scrolling for table rows
	const { rows } = table.getRowModel();
	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => tableContainerRef.current,
		estimateSize: () => 56, // Updated to match new row height
		overscan: 10,
	});

	const virtualRows = virtualizer.getVirtualItems();

	// Determine drawing status color
	const getStatusColor = () => {
		if (stats.completed === stats.total && stats.total > 0) {
			return "border-fieldComplete bg-fieldComplete/5";
		}
		if (stats.inProgress > 0 || stats.completed > 0) {
			return "border-blue-500 bg-blue-50/50";
		}
		return "border-gray-300 bg-white";
	};

	// Get status icon
	const getStatusIcon = () => {
		if (stats.completed === stats.total && stats.total > 0) {
			return <Check className="h-5 w-5 text-fieldComplete" />;
		}
		if (stats.inProgress > 0) {
			return <Clock className="h-5 w-5 text-blue-600" />;
		}
		return <AlertCircle className="h-5 w-5 text-fieldPending" />;
	};

	const handleSelectAll = () => {
		const componentIds = components.map((c) => c.id);
		onRowSelectionChange(componentIds, !stats.allSelected);
	};

	return (
		<Card
			className={cn(
				"transition-all duration-200 w-full min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm",
				"hover:shadow-md active:scale-[0.99] touch-manipulation", // Better touch feedback for tablets
				getStatusColor(),
				stats.selectedInGroup > 0 && "ring-2 ring-primary",
			)}
		>
			<CardHeader
				className="cursor-pointer p-4 md:p-6"
				onClick={onToggleExpand}
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3 min-w-0 flex-1">
						{/* Selection Checkbox - Larger touch target for tablets */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleSelectAll();
							}}
							className="cursor-pointer p-1 -m-1 rounded-lg hover:bg-white/50 touch-manipulation" // 44px+ touch target
						>
							{stats.someSelected && !stats.allSelected ? (
								// Custom indeterminate state
								<div className="h-7 w-7 md:h-8 md:w-8 rounded border-2 border-primary bg-primary flex items-center justify-center">
									<Minus className="h-5 w-5 text-primary-foreground" />
								</div>
							) : (
								<Checkbox
									checked={stats.allSelected}
									onCheckedChange={handleSelectAll}
									onClick={(e) => e.stopPropagation()}
									className="h-7 w-7 md:h-8 md:w-8" // Larger for better touch interaction
								/>
							)}
						</button>

						{/* Drawing Info - Better responsive layout */}
						<div className="flex items-center gap-2 min-w-0">
							<MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
							<h3 className="font-bold text-lg md:text-xl lg:text-2xl truncate">
								{drawingNumber || "No Drawing"}
							</h3>
							<div className="flex items-center gap-1 ml-auto md:ml-0">
								{isExpanded ? (
									<span className="h-6 w-6 text-gray-500 text-center">↓</span>
								) : (
									<span className="h-6 w-6 text-gray-500 text-center">→</span>
								)}
							</div>
						</div>

						{/* Component Count and Status - Responsive badges */}
						<div className="flex items-center gap-2 flex-wrap">
							<Badge
								status="info"
								className="text-sm whitespace-nowrap"
							>
								<Package className="h-4 w-4 mr-1" />
								{stats.total} component
								{stats.total !== 1 ? "s" : ""}
							</Badge>

							{stats.selectedInGroup > 0 && (
								<Badge
									status="info"
									className="text-sm whitespace-nowrap"
								>
									{stats.selectedInGroup} selected
								</Badge>
							)}
						</div>
					</div>

					{/* Progress and Status - Responsive layout for tablets */}
					<div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
						{/* Status counts - Hide on smaller tablets, show on larger ones */}
						<div className="hidden lg:flex items-center gap-2 text-sm">
							{stats.completed > 0 && (
								<span className="flex items-center gap-1 text-fieldComplete whitespace-nowrap">
									<Check className="h-4 w-4" />
									{stats.completed}
								</span>
							)}
							{stats.inProgress > 0 && (
								<span className="flex items-center gap-1 text-blue-600 whitespace-nowrap">
									<Clock className="h-4 w-4" />
									{stats.inProgress}
								</span>
							)}
							{stats.notStarted > 0 && (
								<span className="flex items-center gap-1 text-fieldPending whitespace-nowrap">
									<AlertCircle className="h-4 w-4" />
									{stats.notStarted}
								</span>
							)}
						</div>

						{/* Progress bar - Responsive width */}
						<div className="flex items-center gap-2 min-w-[120px] md:min-w-[150px]">
							<Progress
								value={stats.avgProgress}
								className="h-3 flex-1"
							/>
							<span className="text-sm font-bold w-12 text-right">
								{stats.avgProgress}%
							</span>
						</div>

						{getStatusIcon()}
					</div>
				</div>
			</CardHeader>

			{/* Expanded Table View */}
			{isExpanded && (
				<CardContent className="p-0">
					<div className="border-t">
						{components.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground">
								No components in this drawing
							</div>
						) : (
							<div
								ref={tableContainerRef}
								className="relative w-full overflow-auto rounded-lg"
								style={{
									maxHeight: "600px",
									overflowX: "auto",
									// Improve tablet scrolling performance
									WebkitOverflowScrolling: "touch",
									// Ensure minimum width for proper column display on tablets
									minWidth: "100%",
									// Use majority of available width on tablets
									width: "100%",
								}}
							>
								<table
									className="w-full min-w-[800px] md:min-w-[85vw] lg:min-w-[900px] xl:min-w-[1000px]"
									style={{
										tableLayout: "fixed",
										width: "100%",
									}}
								>
									{/* Table Header */}
									<thead className="sticky top-0 z-10 bg-gray-50 border-b">
										{table
											.getHeaderGroups()
											.map((headerGroup) => (
												<tr key={headerGroup.id}>
													{headerGroup.headers.map(
														(header) => {
															const isDraggable =
																![
																	"select",
																	"drawingNumber",
																	"componentId",
																].includes(
																	header.id,
																);
															const isDropTarget =
																targetColumn ===
																header.id;

															return (
																<th
																	key={
																		header.id
																	}
																	className={cn(
																		"relative px-3 py-3 text-left text-sm font-semibold text-gray-900 border-r last:border-r-0",
																		"touch-manipulation select-none", // Better tablet interaction
																		isDropTarget &&
																			"bg-blue-100",
																	)}
																	style={{
																		width: header.getSize(),
																		minWidth:
																			header
																				.column
																				.columnDef
																				.minSize,
																		maxWidth:
																			header
																				.column
																				.columnDef
																				.maxSize,
																	}}
																	draggable={
																		isDraggable
																	}
																	onDragStart={
																		isDraggable
																			? () =>
																					onDragStart(
																						header.id,
																					)
																			: undefined
																	}
																	onDragOver={
																		isDraggable
																			? (
																					e,
																				) => {
																					e.preventDefault();
																					onDragOver(
																						header.id,
																					);
																				}
																			: undefined
																	}
																	onDrop={
																		isDraggable
																			? onDragEnd
																			: undefined
																	}
																	onDragEnd={
																		onDragEnd
																	}
																>
																	<div className="flex items-center gap-1 group">
																		{isDraggable && (
																			<span className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move text-center">⋮⋮</span>
																		)}
																		{header.isPlaceholder
																			? null
																			: flexRender(
																					header
																						.column
																						.columnDef
																						.header,
																					header.getContext(),
																				)}
																	</div>

																	{/* Column resize handle */}
																	{header.column.getCanResize() && (
																		// biome-ignore lint/a11y/noStaticElementInteractions: Column resize handle needs mouse/touch events
																		<div
																			onMouseDown={header.getResizeHandler()}
																			onTouchStart={header.getResizeHandler()}
																			className={cn(
																				"absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10",
																				"bg-blue-200 hover:bg-blue-500 transition-all opacity-50 hover:opacity-100",
																				header.column.getIsResizing() &&
																					"bg-blue-500 opacity-100",
																			)}
																			style={{
																				right: "-1px", // Extend slightly outside the column
																			}}
																		/>
																	)}
																</th>
															);
														},
													)}
												</tr>
											))}
									</thead>

									{/* Table Body */}
									<tbody>
										{/* Spacer for virtual scrolling */}
										<tr
											style={{
												height:
													virtualizer.getVirtualItems()[0]
														?.start || 0,
											}}
										/>

										{virtualRows.map((virtualRow) => {
											const row = rows[virtualRow.index];
											return (
												<tr
													key={row.id}
													className={cn(
														"border-b hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation",
														row.getIsSelected() &&
															"bg-blue-50",
													)}
													style={{
														height: "56px", // Increased for better tablet touch targets
													}}
												>
													{row
														.getVisibleCells()
														.map((cell) => (
															<td
																key={cell.id}
																className="px-3 py-2 border-r last:border-r-0" // Increased padding
																style={{
																	width: cell.column.getSize(),
																	maxWidth:
																		cell.column.getSize(),
																}}
															>
																<div className="flex items-center h-full min-h-[44px]">
																	{" "}
																	{/* Ensure 44px minimum touch target */}
																	{flexRender(
																		cell
																			.column
																			.columnDef
																			.cell,
																		cell.getContext(),
																	)}
																</div>
															</td>
														))}
												</tr>
											);
										})}

										{/* Spacer for remaining virtual items */}
										<tr
											style={{
												height:
													virtualizer.getTotalSize() -
													(virtualRows[
														virtualRows.length - 1
													]?.end || 0),
											}}
										/>
									</tbody>
								</table>
							</div>
						)}
					</div>
				</CardContent>
			)}
		</Card>
	);
}
