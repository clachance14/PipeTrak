"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { ScrollArea } from "@ui/components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import { Alert, AlertDescription } from "@ui/components/alert";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertTriangle,
	RefreshCw,
	Download,
	Copy,
	CheckCircle,
	XCircle,
	Clock,
} from "lucide-react";
import { toast } from "sonner";
import type {
	BulkUpdateResult,
	BulkUpdateFailure,
} from "../lib/bulk-update-utils";

interface FailureDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	failures: BulkUpdateFailure[];
	onRetry?: (failedItems: BulkUpdateFailure[]) => Promise<BulkUpdateResult>;
}

interface FailureItem extends BulkUpdateFailure {
	selected?: boolean;
	retryStatus?: "pending" | "success" | "failed";
}

export function FailureDetailsModal({
	isOpen,
	onClose,
	failures: initialFailures,
	onRetry,
}: FailureDetailsModalProps) {
	const [failures, setFailures] = useState<FailureItem[]>(() =>
		initialFailures.map((f) => ({ ...f, selected: false })),
	);
	const [isRetrying, setIsRetrying] = useState(false);
	const [selectAll, setSelectAll] = useState(false);

	// Update failures when prop changes
	useState(() => {
		if (
			initialFailures !==
			failures.map((f) => ({
				componentId: f.componentId,
				milestoneName: f.milestoneName,
				error: f.error,
			}))
		) {
			setFailures(
				initialFailures.map((f) => ({ ...f, selected: false })),
			);
		}
	});

	// Toggle individual failure selection
	const toggleFailureSelection = (index: number) => {
		setFailures((prev) =>
			prev.map((failure, i) =>
				i === index
					? { ...failure, selected: !failure.selected }
					: failure,
			),
		);
	};

	// Toggle select all
	const toggleSelectAll = () => {
		const newSelectAll = !selectAll;
		setSelectAll(newSelectAll);
		setFailures((prev) =>
			prev.map((failure) => ({ ...failure, selected: newSelectAll })),
		);
	};

	// Get selected failures
	const selectedFailures = failures.filter((f) => f.selected);

	// Copy failures to clipboard
	const copyFailuresToClipboard = () => {
		const failureText = failures
			.map(
				(f) =>
					`${f.componentId}: ${f.error}${f.milestoneName ? ` (${f.milestoneName})` : ""}`,
			)
			.join("\n");

		navigator.clipboard
			.writeText(failureText)
			.then(() => {
				toast.success("Failures copied to clipboard");
			})
			.catch(() => {
				toast.error("Failed to copy to clipboard");
			});
	};

	// Export failures as CSV
	const exportFailuresAsCSV = () => {
		const csvContent = [
			["Component ID", "Milestone", "Error"],
			...failures.map((f) => [
				f.componentId,
				f.milestoneName || "",
				f.error,
			]),
		]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `bulk-update-failures-${new Date().toISOString().split("T")[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);

		toast.success("Failures exported to CSV");
	};

	// Retry selected failures
	const handleRetry = async () => {
		if (!onRetry || selectedFailures.length === 0) return;

		setIsRetrying(true);

		try {
			// Mark selected items as pending
			setFailures((prev) =>
				prev.map((failure) =>
					failure.selected
						? { ...failure, retryStatus: "pending" }
						: failure,
				),
			);

			// Attempt retry
			const result = await onRetry(selectedFailures);

			// Update status based on results
			setFailures((prev) =>
				prev.map((failure) => {
					if (!failure.selected) return failure;

					// Check if this item was successful in the retry
					const wasSuccessful = result.successful.some(
						(s) => s.componentId === failure.componentId,
					);
					const newFailure = result.failed.find(
						(f) => f.componentId === failure.componentId,
					);

					if (wasSuccessful) {
						return {
							...failure,
							retryStatus: "success",
							selected: false,
						};
					}
					if (newFailure) {
						return {
							...failure,
							retryStatus: "failed",
							error: newFailure.error,
							selected: false,
						};
					}
					return {
						...failure,
						retryStatus: "failed",
						selected: false,
					};
				}),
			);

			if (result.successful.length > 0) {
				toast.success(
					`Successfully retried ${result.successful.length} of ${selectedFailures.length} items`,
				);
			} else {
				toast.error("All retry attempts failed");
			}
		} catch (error) {
			toast.error("Retry operation failed");
			console.error("Retry failed:", error);

			// Mark all selected as failed
			setFailures((prev) =>
				prev.map((failure) =>
					failure.selected
						? { ...failure, retryStatus: "failed", selected: false }
						: failure,
				),
			);
		} finally {
			setIsRetrying(false);
			setSelectAll(false);
		}
	};

	// Group failures by error type for better organization
	const failureGroups = failures.reduce(
		(groups, failure) => {
			const errorType = failure.error.split(":")[0] || "Other";
			if (!groups[errorType]) {
				groups[errorType] = [];
			}
			groups[errorType].push(failure);
			return groups;
		},
		{} as Record<string, FailureItem[]>,
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-orange-600" />
						Update Failures ({failures.length})
					</DialogTitle>
					<DialogDescription>
						Review and retry failed component updates. Some common
						issues can be resolved by retrying the operation.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					{/* Action Bar */}
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={selectAll}
								onCheckedChange={toggleSelectAll}
							/>
							<span className="text-sm font-medium">
								{selectedFailures.length > 0
									? `${selectedFailures.length} of ${failures.length} selected`
									: `Select all ${failures.length} failures`}
							</span>
						</div>

						<div className="flex gap-2">
							<Button
								status="info"
								size="sm"
								onClick={copyFailuresToClipboard}
								disabled={failures.length === 0}
							>
								<Copy className="h-4 w-4 mr-2" />
								Copy
							</Button>

							<Button
								status="info"
								size="sm"
								onClick={exportFailuresAsCSV}
								disabled={failures.length === 0}
							>
								<Download className="h-4 w-4 mr-2" />
								Export CSV
							</Button>

							{onRetry && (
								<Button
									onClick={handleRetry}
									disabled={
										selectedFailures.length === 0 ||
										isRetrying
									}
									size="sm"
								>
									{isRetrying ? (
										<Clock className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4 mr-2" />
									)}
									Retry Selected
								</Button>
							)}
						</div>
					</div>

					{/* Failure Summary */}
					<div className="p-4 space-y-4">
						<Alert>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
								<strong>Common Solutions:</strong>
								<ul className="mt-2 text-sm list-disc list-inside space-y-1">
									<li>
										Milestone not found: Check if the
										milestone exists for that component type
									</li>
									<li>
										Access denied: Ensure you have
										permission to modify these components
									</li>
									<li>
										Network errors: Check your connection
										and retry the operation
									</li>
								</ul>
							</AlertDescription>
						</Alert>

						{/* Grouped Failures */}
						<ScrollArea className="h-[400px]">
							{Object.entries(failureGroups).map(
								([errorType, groupFailures]) => (
									<Card key={errorType} className="mb-4">
										<CardHeader className="pb-3">
											<CardTitle className="text-sm flex items-center justify-between">
												<span>{errorType}</span>
												<Badge status="info">
													{groupFailures.length}{" "}
													failures
												</Badge>
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12">
															<Checkbox
																checked={groupFailures.every(
																	(f) =>
																		f.selected,
																)}
																indeterminate={
																	groupFailures.some(
																		(f) =>
																			f.selected,
																	) &&
																	!groupFailures.every(
																		(f) =>
																			f.selected,
																	)
																}
																onCheckedChange={(
																	checked,
																) => {
																	setFailures(
																		(
																			prev,
																		) =>
																			prev.map(
																				(
																					failure,
																				) => {
																					const isInGroup =
																						groupFailures.includes(
																							failure,
																						);
																					return isInGroup
																						? {
																								...failure,
																								selected:
																									!!checked,
																							}
																						: failure;
																				},
																			),
																	);
																}}
															/>
														</TableHead>
														<TableHead>
															Component
														</TableHead>
														<TableHead>
															Milestone
														</TableHead>
														<TableHead>
															Error
														</TableHead>
														<TableHead className="w-20">
															Status
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{groupFailures.map(
														(failure, index) => {
															const globalIndex =
																failures.indexOf(
																	failure,
																);
															return (
																<TableRow
																	key={`${failure.componentId}-${index}`}
																>
																	<TableCell>
																		<Checkbox
																			checked={
																				failure.selected ||
																				false
																			}
																			onCheckedChange={() =>
																				toggleFailureSelection(
																					globalIndex,
																				)
																			}
																		/>
																	</TableCell>
																	<TableCell className="font-mono text-sm">
																		{
																			failure.componentId
																		}
																	</TableCell>
																	<TableCell>
																		{failure.milestoneName ? (
																			<Badge status="success">
																				{
																					failure.milestoneName
																				}
																			</Badge>
																		) : (
																			<span className="text-muted-foreground">
																				-
																			</span>
																		)}
																	</TableCell>
																	<TableCell className="max-w-md">
																		<div
																			className="text-sm text-red-600 truncate"
																			title={
																				failure.error
																			}
																		>
																			{
																				failure.error
																			}
																		</div>
																	</TableCell>
																	<TableCell>
																		{failure.retryStatus ===
																			"pending" && (
																			<Clock className="h-4 w-4 text-blue-600 animate-spin" />
																		)}
																		{failure.retryStatus ===
																			"success" && (
																			<CheckCircle className="h-4 w-4 text-green-600" />
																		)}
																		{failure.retryStatus ===
																			"failed" && (
																			<XCircle className="h-4 w-4 text-red-600" />
																		)}
																	</TableCell>
																</TableRow>
															);
														},
													)}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								),
							)}
						</ScrollArea>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
