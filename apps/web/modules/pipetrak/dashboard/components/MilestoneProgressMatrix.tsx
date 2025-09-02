"use client";

import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { ToggleGroup, ToggleGroupItem } from "@ui/components/toggle-group";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import {
	MapPin,
	Package,
	Box,
	Download,
	Printer,
	Settings,
	BarChart3,
} from "lucide-react";
import { Button } from "@ui/components/button";
import type { ComponentWithMilestones } from "../../types";

interface MilestoneProgressMatrixProps {
	components: ComponentWithMilestones[];
	showSystems?: boolean;
	showTestPackages?: boolean;
	loading?: boolean;
}

interface MilestoneStats {
	totalCount: number;
	completedCount: number;
	completionPercent: number;
}

interface MatrixCell {
	area: string;
	milestone: string;
	stats: MilestoneStats;
	components: ComponentWithMilestones[];
}

interface ProgressTableData {
	rowKey: string;
	rowLabel: string;
	milestones: Record<string, MilestoneStats | null>;
	totalComponents: number;
}

export function MilestoneProgressMatrix({
	components,
	showSystems = false,
	showTestPackages = false,
	loading = false,
}: MilestoneProgressMatrixProps) {
	const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"area" | "system" | "testPackage">(
		"area",
	);

	const { milestones, tableData, totalStats } = useMemo(() => {
		// Define the correct milestone order - using normalized names only
		const milestoneOrder = [
			"Receive",
			"Install",
			"Punch",
			"Test",
			"Restore",
			"Paint",
			"Insulate",
		];

		// Map installation-related milestones to "Install" for display
		const installMilestones = new Set([
			"Install",
			"Installed",
			"Erect",
			"Erected",
			"Connect",
			"Connected",
			"Weld",
			"Welded",
			"Fit-up",
			"Fitted",
		]);

		// Always show all milestones in the defined order
		const milestones = [...milestoneOrder];

		// Get unique rows based on view mode
		const rowsSet = new Set<string>();
		let totalComponents = 0;

		components.forEach((comp) => {
			totalComponents++;
			if (viewMode === "area" && comp.area) {
				rowsSet.add(comp.area);
			} else if (viewMode === "system" && comp.system) {
				rowsSet.add(comp.system);
			} else if (viewMode === "testPackage" && comp.testPackage) {
				rowsSet.add(comp.testPackage);
			}
		});

		const rows = Array.from(rowsSet).sort();
		const tableData: ProgressTableData[] = [];

		// Build table data
		rows.forEach((row) => {
			const rowData: ProgressTableData = {
				rowKey: row,
				rowLabel: row,
				milestones: {},
				totalComponents: 0,
			};

			// Count total components for this row
			const rowComponents = components.filter((comp) => {
				if (viewMode === "area") return comp.area === row;
				if (viewMode === "system") return comp.system === row;
				return comp.testPackage === row;
			});

			rowData.totalComponents = rowComponents.length;

			// Calculate stats for each milestone
			milestones.forEach((milestone) => {
				const cellComponents = rowComponents.filter((comp) => {
					// Check if component has this milestone (handling grouped Install milestones)
					const hasMilestone = comp.milestones?.some((m) => {
						if (milestone === "Install") {
							return installMilestones.has(m.milestoneName);
						}
						if (milestone === "Receive") {
							return (
								m.milestoneName === "Receive" ||
								m.milestoneName === "Received"
							);
						}
						if (milestone === "Punch") {
							return (
								m.milestoneName === "Punch" ||
								m.milestoneName === "Punched"
							);
						}
						if (milestone === "Test") {
							return (
								m.milestoneName === "Test" ||
								m.milestoneName === "Tested"
							);
						}
						if (milestone === "Restore") {
							return (
								m.milestoneName === "Restore" ||
								m.milestoneName === "Restored"
							);
						}
						if (milestone === "Paint") {
							return (
								m.milestoneName === "Paint" ||
								m.milestoneName === "Painted"
							);
						}
						if (milestone === "Insulate") {
							return (
								m.milestoneName === "Insulate" ||
								m.milestoneName === "Insulated"
							);
						}
						return m.milestoneName === milestone;
					});

					return hasMilestone;
				});

				if (cellComponents.length > 0) {
					// Calculate stats for this cell
					let totalCount = 0;
					let completedCount = 0;

					cellComponents.forEach((comp) => {
						const matchingMilestones =
							comp.milestones?.filter((m) => {
								if (milestone === "Install") {
									return installMilestones.has(
										m.milestoneName,
									);
								}
								if (milestone === "Receive") {
									return (
										m.milestoneName === "Receive" ||
										m.milestoneName === "Received"
									);
								}
								if (milestone === "Punch") {
									return (
										m.milestoneName === "Punch" ||
										m.milestoneName === "Punched"
									);
								}
								if (milestone === "Test") {
									return (
										m.milestoneName === "Test" ||
										m.milestoneName === "Tested"
									);
								}
								if (milestone === "Restore") {
									return (
										m.milestoneName === "Restore" ||
										m.milestoneName === "Restored"
									);
								}
								if (milestone === "Paint") {
									return (
										m.milestoneName === "Paint" ||
										m.milestoneName === "Painted"
									);
								}
								if (milestone === "Insulate") {
									return (
										m.milestoneName === "Insulate" ||
										m.milestoneName === "Insulated"
									);
								}
								return m.milestoneName === milestone;
							}) || [];

						matchingMilestones.forEach((milestone_data) => {
							totalCount++;
							if (milestone_data.isCompleted) {
								completedCount++;
							}
						});
					});

					const completionPercent =
						totalCount > 0
							? Math.round((completedCount / totalCount) * 100)
							: 0;

					rowData.milestones[milestone] = {
						totalCount,
						completedCount,
						completionPercent,
					};
				} else {
					rowData.milestones[milestone] = null;
				}
			});

			tableData.push(rowData);
		});

		// Calculate overall stats
		let overallCompleted = 0;
		let overallTotal = 0;

		components.forEach((comp) => {
			const completedMilestones =
				comp.milestones?.filter((m) => m.isCompleted).length || 0;
			const totalMilestones = comp.milestones?.length || 0;
			overallCompleted += completedMilestones;
			overallTotal += totalMilestones;
		});

		const overallPercent =
			overallTotal > 0
				? Math.round((overallCompleted / overallTotal) * 100)
				: 0;

		return {
			milestones,
			tableData,
			totalStats: {
				areas: rows.length,
				milestones: milestones.length,
				components: totalComponents,
				overallPercent,
			},
		};
	}, [components, viewMode]);

	const handleCellClick = (
		row: string,
		milestone: string,
		stats: MilestoneStats,
	) => {
		// Find components for this cell
		const cellComponents = components.filter((comp) => {
			const rowMatch =
				viewMode === "area"
					? comp.area === row
					: viewMode === "system"
						? comp.system === row
						: comp.testPackage === row;

			const installMilestones = new Set([
				"Install",
				"Installed",
				"Erect",
				"Erected",
				"Connect",
				"Connected",
				"Weld",
				"Welded",
				"Fit-up",
				"Fitted",
			]);

			const hasMilestone = comp.milestones?.some((m) => {
				if (milestone === "Install") {
					return installMilestones.has(m.milestoneName);
				}
				if (milestone === "Receive") {
					return (
						m.milestoneName === "Receive" ||
						m.milestoneName === "Received"
					);
				}
				if (milestone === "Punch") {
					return (
						m.milestoneName === "Punch" ||
						m.milestoneName === "Punched"
					);
				}
				if (milestone === "Test") {
					return (
						m.milestoneName === "Test" ||
						m.milestoneName === "Tested"
					);
				}
				if (milestone === "Restore") {
					return (
						m.milestoneName === "Restore" ||
						m.milestoneName === "Restored"
					);
				}
				if (milestone === "Paint") {
					return (
						m.milestoneName === "Paint" ||
						m.milestoneName === "Painted"
					);
				}
				if (milestone === "Insulate") {
					return (
						m.milestoneName === "Insulate" ||
						m.milestoneName === "Insulated"
					);
				}
				return m.milestoneName === milestone;
			});

			return rowMatch && hasMilestone;
		});

		setSelectedCell({
			area: row,
			milestone,
			stats,
			components: cellComponents,
		});
		setSheetOpen(true);
	};

	const getProgressCellClass = (stats: MilestoneStats | null) => {
		if (!stats || stats.completionPercent === 0)
			return "progress-cell-empty";
		if (stats.completionPercent >= 71) return "progress-cell-high";
		if (stats.completionPercent >= 31) return "progress-cell-medium";
		return "progress-cell-low";
	};

	const viewOptions = [
		{ value: "area", label: "Area", icon: MapPin },
		...(showSystems
			? [{ value: "system", label: "System", icon: Box }]
			: []),
		...(showTestPackages
			? [{ value: "testPackage", label: "Test Package", icon: Package }]
			: []),
	];

	// Empty state
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Milestone Completion Tracker</CardTitle>
					<CardDescription>Loading milestone data...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse space-y-4">
						<div className="h-8 bg-gray-200 rounded w-1/4"></div>
						<div className="space-y-2">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="flex space-x-2">
									<div className="h-6 bg-gray-200 rounded w-32"></div>
									{[...Array(7)].map((_, j) => (
										<div
											key={j}
											className="h-6 bg-gray-200 rounded w-16"
										></div>
									))}
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (components.length === 0) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Milestone Completion Tracker</CardTitle>
							<CardDescription>
								Track progress across your project's key
								milestones
							</CardDescription>
						</div>
						{viewOptions.length > 1 && (
							<ToggleGroup
								type="single"
								value={viewMode}
								onValueChange={(value) =>
									value && setViewMode(value as any)
								}
								size="sm"
							>
								{viewOptions.map((option) => {
									const Icon = option.icon;
									return (
										<ToggleGroupItem
											key={option.value}
											value={option.value}
											aria-label={`By ${option.label}`}
										>
											<Icon className="h-3.5 w-3.5 mr-1" />
											{option.label}
										</ToggleGroupItem>
									);
								})}
							</ToggleGroup>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center h-80 text-center space-y-6">
						<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
							<BarChart3 className="w-8 h-8 text-gray-400" />
						</div>
						<div className="space-y-2">
							<h3 className="text-lg font-semibold text-gray-900">
								No milestone data to display
							</h3>
							<p className="text-sm text-gray-600 max-w-md">
								Select areas, systems, or test packages to track
								milestone progress. You can also import
								component data to get started.
							</p>
						</div>
						<div className="flex gap-3">
							<Button variant="default" size="sm">
								Import Components
							</Button>
							<Button variant="outline" size="sm">
								Select Filters
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Milestone Completion Tracker</CardTitle>
							<CardDescription>
								Track progress across your project's key
								milestones
							</CardDescription>
						</div>
						{viewOptions.length > 1 && (
							<ToggleGroup
								type="single"
								value={viewMode}
								onValueChange={(value) =>
									value && setViewMode(value as any)
								}
								size="sm"
							>
								{viewOptions.map((option) => {
									const Icon = option.icon;
									return (
										<ToggleGroupItem
											key={option.value}
											value={option.value}
											aria-label={`By ${option.label}`}
										>
											<Icon className="h-3.5 w-3.5 mr-1" />
											{option.label}
										</ToggleGroupItem>
									);
								})}
							</ToggleGroup>
						)}
					</div>

					{/* Stats Bar */}
					<div className="flex gap-6 pt-3 text-sm">
						<div className="flex items-center gap-2">
							<span className="font-semibold text-gray-900">
								{totalStats.areas}
							</span>
							<span className="text-gray-600">
								{viewMode === "area"
									? "Areas"
									: viewMode === "system"
										? "Systems"
										: "Test Packages"}{" "}
								tracked
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold text-gray-900">
								{totalStats.milestones}
							</span>
							<span className="text-gray-600">
								Active milestones
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold text-gray-900">
								{totalStats.components.toLocaleString()}
							</span>
							<span className="text-gray-600">
								Total components
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold text-gray-900">
								{totalStats.overallPercent}%
							</span>
							<span className="text-gray-600">
								Overall completion
							</span>
						</div>
					</div>
				</CardHeader>

				<CardContent className="px-6 pb-4">
					{/* Table Controls */}
					<div className="flex justify-between items-center mb-4">
						<div className="text-sm text-gray-600">
							Showing {tableData.length}{" "}
							{viewMode === "area"
								? "areas"
								: viewMode === "system"
									? "systems"
									: "test packages"}{" "}
							× {milestones.length} milestones • Click any cell
							for details
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm">
								<Download className="h-4 w-4 mr-2" />
								Export
							</Button>
							<Button variant="outline" size="sm">
								<Printer className="h-4 w-4 mr-2" />
								Print
							</Button>
							<Button variant="outline" size="sm">
								<Settings className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Progress Table */}
					<div className="overflow-auto border rounded-lg">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-gray-50 border-b">
									<th className="text-left p-3 font-semibold text-gray-700 bg-gray-100 sticky left-0 z-10 min-w-[180px]">
										{viewMode === "area"
											? "Area"
											: viewMode === "system"
												? "System"
												: "Test Package"}{" "}
										/ Milestone
									</th>
									{milestones.map((milestone) => (
										<th
											key={milestone}
											className="text-center p-3 font-semibold text-gray-700 min-w-[80px]"
										>
											{milestone}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{tableData.map((row, index) => (
									<tr
										key={row.rowKey}
										className="border-b hover:bg-gray-50/50"
									>
										<td className="p-3 font-medium text-gray-900 bg-gray-50/30 sticky left-0 z-10 border-r">
											{row.rowLabel}
										</td>
										{milestones.map((milestone) => {
											const stats =
												row.milestones[milestone];
											return (
												<td
													key={milestone}
													className="p-1"
												>
													<div
														className={`
                              cursor-pointer text-center p-2 rounded transition-all hover:scale-105 hover:shadow-md
                              ${getProgressCellClass(stats)}
                            `}
														onClick={() =>
															stats &&
															handleCellClick(
																row.rowKey,
																milestone,
																stats,
															)
														}
													>
														{stats ? (
															<div>
																<div className="text-base font-semibold">
																	{
																		stats.completionPercent
																	}
																	%
																</div>
																<div className="text-xs opacity-80 mt-0.5">
																	{
																		stats.completedCount
																	}
																	/
																	{
																		stats.totalCount
																	}
																</div>
															</div>
														) : (
															<div>
																<div className="text-base font-semibold">
																	—
																</div>
																<div className="text-xs opacity-80 mt-0.5">
																	0/0
																</div>
															</div>
														)}
													</div>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>

				{/* Legend */}
				<div className="flex items-center gap-6 px-6 py-4 border-t bg-gray-50/30 text-sm">
					<span className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
						Completion Status:
					</span>
					<div className="flex gap-4">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-200 rounded"></div>
							<span>71-100% Complete</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-yellow-200 rounded"></div>
							<span>31-70% Complete</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-200 rounded"></div>
							<span>1-30% Complete</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-gray-100 rounded"></div>
							<span>Not Started</span>
						</div>
					</div>
				</div>
			</Card>

			{/* Drill-down sheet */}
			{selectedCell && (
				<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
					<SheetContent className="w-[400px] sm:w-[540px]">
						<SheetHeader>
							<SheetTitle>
								{selectedCell.area} - {selectedCell.milestone}
							</SheetTitle>
							<SheetDescription>
								{selectedCell.stats.completedCount} of{" "}
								{selectedCell.stats.totalCount} components
								completed
							</SheetDescription>
						</SheetHeader>
						<div className="mt-4 space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										Completed
									</p>
									<p className="text-2xl font-bold text-green-600">
										{selectedCell.stats.completedCount}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Remaining
									</p>
									<p className="text-2xl font-bold text-orange-600">
										{selectedCell.stats.totalCount -
											selectedCell.stats.completedCount}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Progress
									</p>
									<p className="text-2xl font-bold">
										{selectedCell.stats.completionPercent}%
									</p>
								</div>
							</div>

							<div>
								<h4 className="font-medium mb-2">
									Components in this cell:
								</h4>
								<div className="max-h-[400px] overflow-y-auto space-y-2">
									{selectedCell.components.map((comp) => {
										const installMilestones = new Set([
											"Install",
											"Installed",
											"Erect",
											"Erected",
											"Connect",
											"Connected",
											"Weld",
											"Welded",
											"Fit-up",
											"Fitted",
										]);

										const matchingMilestones =
											comp.milestones?.filter((m) => {
												if (
													selectedCell.milestone ===
													"Install"
												) {
													return installMilestones.has(
														m.milestoneName,
													);
												}
												if (
													selectedCell.milestone ===
													"Receive"
												) {
													return (
														m.milestoneName ===
															"Receive" ||
														m.milestoneName ===
															"Received"
													);
												}
												if (
													selectedCell.milestone ===
													"Punch"
												) {
													return (
														m.milestoneName ===
															"Punch" ||
														m.milestoneName ===
															"Punched"
													);
												}
												if (
													selectedCell.milestone ===
													"Test"
												) {
													return (
														m.milestoneName ===
															"Test" ||
														m.milestoneName ===
															"Tested"
													);
												}
												if (
													selectedCell.milestone ===
													"Restore"
												) {
													return (
														m.milestoneName ===
															"Restore" ||
														m.milestoneName ===
															"Restored"
													);
												}
												if (
													selectedCell.milestone ===
													"Paint"
												) {
													return (
														m.milestoneName ===
															"Paint" ||
														m.milestoneName ===
															"Painted"
													);
												}
												if (
													selectedCell.milestone ===
													"Insulate"
												) {
													return (
														m.milestoneName ===
															"Insulate" ||
														m.milestoneName ===
															"Insulated"
													);
												}
												return (
													m.milestoneName ===
													selectedCell.milestone
												);
											}) || [];

										const allCompleted =
											matchingMilestones.length > 0 &&
											matchingMilestones.every(
												(m) => m.isCompleted,
											);
										const someCompleted =
											matchingMilestones.some(
												(m) => m.isCompleted,
											);

										return (
											<div
												key={comp.id}
												className="p-3 border rounded-lg"
											>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-sm">
															{comp.componentId}
														</p>
														<p className="text-xs text-muted-foreground">
															{comp.type} •{" "}
															{comp.spec} •{" "}
															{comp.size}
														</p>
														{selectedCell.milestone ===
															"Install" &&
															matchingMilestones.length >
																0 && (
																<p className="text-xs text-muted-foreground mt-1">
																	{matchingMilestones
																		.map(
																			(
																				m,
																			) =>
																				m.milestoneName,
																		)
																		.join(
																			", ",
																		)}
																</p>
															)}
													</div>
													<div
														className={`px-2 py-1 rounded text-xs font-medium ${
															allCompleted
																? "bg-green-100 text-green-800"
																: someCompleted
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-gray-100 text-gray-800"
														}`}
													>
														{allCompleted
															? "Complete"
															: someCompleted
																? "Partial"
																: "Pending"}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			)}

			<style jsx>{`
        .progress-cell-empty {
          background: #f9fafb;
          color: #9ca3af;
        }
        .progress-cell-low {
          background: #fee2e2;
          color: #991b1b;
        }
        .progress-cell-medium {
          background: #fef3c7;
          color: #92400e;
        }
        .progress-cell-high {
          background: #d1fae5;
          color: #065f46;
        }
      `}</style>
		</>
	);
}
