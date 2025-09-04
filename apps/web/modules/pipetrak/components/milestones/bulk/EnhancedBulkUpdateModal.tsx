"use client";

import { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Slider } from "@ui/components/slider";
import {
	Users,
	Clock,
	Check,
	Eye,
	Play,
	Undo2,
	Package,
	Target,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones, WorkflowType } from "../../../types";

interface BulkUpdatePreview {
	componentId: string;
	milestoneName: string;
	currentValue: any;
	newValue: any;
	hasChanges: boolean;
}

interface BulkUpdateResult {
	successful: number;
	failed: number;
	transactionId?: string;
	results: Array<{
		componentId: string;
		milestoneName: string;
		success: boolean;
		error?: string;
		milestone?: any;
	}>;
}

interface EnhancedBulkUpdateModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedComponents: ComponentWithMilestones[];
	onBulkUpdate: (updates: any) => Promise<BulkUpdateResult>;
	onPreview: (updates: any) => Promise<{
		totalUpdates: number;
		validUpdates: number;
		invalidUpdates: number;
		preview: BulkUpdatePreview[];
		invalid: Array<{
			componentId: string;
			milestoneName: string;
			error: string;
		}>;
	}>;
}

type UpdateStep = "configure" | "preview" | "execute" | "complete";

interface MilestoneUpdateConfig {
	enabled: boolean;
	milestoneName: string;
	workflowType: WorkflowType;
	value: boolean | number;
}

export function EnhancedBulkUpdateModal({
	isOpen,
	onClose,
	selectedComponents,
	onBulkUpdate,
	onPreview,
}: EnhancedBulkUpdateModalProps) {
	const [currentStep, setCurrentStep] = useState<UpdateStep>("configure");
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [previewData, setPreviewData] = useState<any>(null);
	const [result, setResult] = useState<BulkUpdateResult | null>(null);

	// Track milestone configurations
	const [milestoneConfigs, setMilestoneConfigs] = useState<
		Record<string, MilestoneUpdateConfig>
	>({});

	// Get unique milestones across all selected components
	const availableMilestones = useMemo(() => {
		const milestoneMap = new Map<
			string,
			{ name: string; workflowType: WorkflowType; count: number }
		>();

		selectedComponents.forEach((component) => {
			component.milestones?.forEach((milestone) => {
				const key = milestone.milestoneName;
				if (milestoneMap.has(key)) {
					milestoneMap.get(key)!.count++;
				} else {
					milestoneMap.set(key, {
						name: milestone.milestoneName,
						workflowType: component.workflowType,
						count: 1,
					});
				}
			});
		});

		return Array.from(milestoneMap.entries()).map(([name, data]) => ({
			...data,
			name,
		}));
	}, [selectedComponents]);

	const handleMilestoneToggle = (milestoneName: string, enabled: boolean) => {
		const milestone = availableMilestones.find(
			(m) => m.name === milestoneName,
		);
		if (!milestone) return;

		setMilestoneConfigs((prev) => ({
			...prev,
			[milestoneName]: {
				enabled,
				milestoneName,
				workflowType: milestone.workflowType,
				value:
					milestone.workflowType === "MILESTONE_DISCRETE" ? true : 0,
			},
		}));
	};

	const handleValueChange = (
		milestoneName: string,
		value: boolean | number,
	) => {
		setMilestoneConfigs((prev) => ({
			...prev,
			[milestoneName]: {
				...prev[milestoneName],
				value,
			},
		}));
	};

	const handlePreview = async () => {
		const enabledConfigs = Object.values(milestoneConfigs).filter(
			(config) => config.enabled,
		);

		if (enabledConfigs.length === 0) {
			toast.error("Please select at least one milestone to update");
			return;
		}

		setIsLoading(true);
		try {
			const updates = selectedComponents.flatMap((component) =>
				enabledConfigs
					.filter((config) =>
						component.milestones?.some(
							(m) => m.milestoneName === config.milestoneName,
						),
					)
					.map((config) => ({
						componentId: component.id,
						milestoneName: config.milestoneName,
						...(config.workflowType === "MILESTONE_DISCRETE"
							? { isCompleted: config.value as boolean }
							: config.workflowType === "MILESTONE_PERCENTAGE"
								? { percentageValue: config.value as number }
								: { quantityValue: config.value as number }),
					})),
			);

			const preview = await onPreview({ updates });
			setPreviewData(preview);
			setCurrentStep("preview");
		} catch (error) {
			toast.error("Failed to generate preview");
		} finally {
			setIsLoading(false);
		}
	};

	const handleExecute = async () => {
		if (!previewData) return;

		setCurrentStep("execute");
		setIsLoading(true);
		setProgress(0);

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			setProgress((prev) => Math.min(prev + 5, 90));
		}, 200);

		try {
			const enabledConfigs = Object.values(milestoneConfigs).filter(
				(config) => config.enabled,
			);
			const updates = selectedComponents.flatMap((component) =>
				enabledConfigs
					.filter((config) =>
						component.milestones?.some(
							(m) => m.milestoneName === config.milestoneName,
						),
					)
					.map((config) => ({
						componentId: component.id,
						milestoneName: config.milestoneName,
						...(config.workflowType === "MILESTONE_DISCRETE"
							? { isCompleted: config.value as boolean }
							: config.workflowType === "MILESTONE_PERCENTAGE"
								? { percentageValue: config.value as number }
								: { quantityValue: config.value as number }),
					})),
			);

			const result = await onBulkUpdate({ updates });

			clearInterval(progressInterval);
			setProgress(100);
			setResult(result);
			setCurrentStep("complete");

			if (result.successful > 0) {
				toast.success(
					`Successfully updated ${result.successful} milestones`,
				);
			}
			if (result.failed > 0) {
				toast.error(`Failed to update ${result.failed} milestones`);
			}
		} catch (error) {
			clearInterval(progressInterval);
			toast.error("Bulk update failed");
			console.error("Bulk update error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = () => {
		setCurrentStep("configure");
		setPreviewData(null);
		setResult(null);
		setProgress(0);
		setMilestoneConfigs({});
	};

	const handleClose = () => {
		handleReset();
		onClose();
	};

	const renderConfigurationStep = () => (
		<div className="space-y-6">
			{/* Selected components summary */}
			<div className="bg-gray-50 rounded-lg p-4">
				<h4 className="font-medium mb-2 flex items-center gap-2">
					<Package className="h-4 w-4" />
					Selected Components ({selectedComponents.length})
				</h4>
				<div className="flex flex-wrap gap-2">
					{selectedComponents.slice(0, 8).map((comp) => (
						<Badge
							key={comp.id}
							status="info"
							className="text-xs"
						>
							{comp.componentId}
						</Badge>
					))}
					{selectedComponents.length > 8 && (
						<Badge status="info">
							+{selectedComponents.length - 8} more
						</Badge>
					)}
				</div>
			</div>

			{/* Milestone selection */}
			<div className="space-y-4">
				<h4 className="font-medium flex items-center gap-2">
					<Target className="h-4 w-4" />
					Select Milestones to Update
				</h4>

				<ScrollArea className="h-64 w-full border rounded-md p-4">
					<div className="space-y-4">
						{availableMilestones.map((milestone) => {
							const config = milestoneConfigs[milestone.name];
							const isEnabled = config?.enabled || false;

							return (
								<div
									key={milestone.name}
									className="space-y-3 pb-3 border-b border-border last:border-0"
								>
									<div className="flex items-center gap-3">
										<Checkbox
											checked={isEnabled}
											onCheckedChange={(checked) =>
												handleMilestoneToggle(
													milestone.name,
													checked as boolean,
												)
											}
										/>
										<div className="flex-1">
											<Label className="text-sm font-medium">
												{milestone.name}
											</Label>
											<div className="flex items-center gap-2 mt-1">
												<Badge
													status="info"
													className="text-xs"
												>
													{milestone.workflowType.replace(
														"MILESTONE_",
														"",
													)}
												</Badge>
												<span className="text-xs text-muted-foreground">
													{milestone.count} component
													{milestone.count !== 1
														? "s"
														: ""}
												</span>
											</div>
										</div>
									</div>

									{isEnabled && (
										<div className="ml-6 space-y-2">
											{milestone.workflowType ===
												"MILESTONE_DISCRETE" && (
												<div className="flex items-center gap-2">
													<Label className="text-sm">
														Mark as:
													</Label>
													<Select
														value={
															config.value
																? "completed"
																: "incomplete"
														}
														onValueChange={(
															value,
														) =>
															handleValueChange(
																milestone.name,
																value ===
																	"completed",
															)
														}
													>
														<SelectTrigger className="w-32">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="completed">
																Completed
															</SelectItem>
															<SelectItem value="incomplete">
																Incomplete
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											)}

											{milestone.workflowType ===
												"MILESTONE_PERCENTAGE" && (
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Label className="text-sm">
															Set to:
														</Label>
														<Input
															type="number"
															min={0}
															max={100}
															value={
																config.value as number
															}
															onChange={(e) =>
																handleValueChange(
																	milestone.name,
																	Number.parseInt(
																		e.target
																			.value,
																	) || 0,
																)
															}
															className="w-20"
														/>
														<span className="text-sm">
															%
														</span>
													</div>
													<Slider
														value={[
															config.value as number,
														]}
														onValueChange={(
															values,
														) =>
															handleValueChange(
																milestone.name,
																values[0],
															)
														}
														max={100}
														step={5}
														className="w-full"
													/>
												</div>
											)}

											{milestone.workflowType ===
												"MILESTONE_QUANTITY" && (
												<div className="flex items-center gap-2">
													<Label className="text-sm">
														Quantity:
													</Label>
													<Input
														type="number"
														min={0}
														value={
															config.value as number
														}
														onChange={(e) =>
															handleValueChange(
																milestone.name,
																Number.parseFloat(
																	e.target
																		.value,
																) || 0,
															)
														}
														className="w-24"
													/>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</div>
		</div>
	);

	const renderPreviewStep = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-medium flex items-center gap-2">
					<Eye className="h-4 w-4" />
					Preview Changes
				</h4>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>Valid: {previewData?.validUpdates || 0}</span>
					<span>Invalid: {previewData?.invalidUpdates || 0}</span>
				</div>
			</div>

			<ScrollArea className="h-64 w-full border rounded-md">
				<div className="p-4 space-y-2">
					{previewData?.preview?.map(
						(item: BulkUpdatePreview, index: number) => (
							<div
								key={index}
								className={cn(
									"flex items-center justify-between p-3 rounded-lg border",
									item.hasChanges
										? "bg-blue-50 border-blue-200"
										: "bg-gray-50",
								)}
							>
								<div className="flex-1">
									<div className="font-medium text-sm">
										{item.milestoneName}
									</div>
									<div className="text-xs text-muted-foreground">
										{item.componentId}
									</div>
								</div>
								<div className="text-right">
									<div className="text-sm">
										{String(item.currentValue)} →{" "}
										<span className="font-medium">
											{String(item.newValue)}
										</span>
									</div>
								</div>
							</div>
						),
					)}
				</div>
			</ScrollArea>

			{previewData?.invalid && previewData.invalid.length > 0 && (
				<div className="space-y-2">
					<h5 className="text-sm font-medium text-destructive">
						Invalid Updates
					</h5>
					<div className="text-xs text-muted-foreground space-y-1">
						{previewData.invalid.map((item: any, index: number) => (
							<div key={index} className="flex justify-between">
								<span>
									{item.componentId} - {item.milestoneName}
								</span>
								<span>{item.error}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderExecuteStep = () => (
		<div className="space-y-6 py-8">
			<div className="text-center">
				<Clock className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
				<h4 className="text-lg font-medium">Updating Milestones...</h4>
				<p className="text-sm text-muted-foreground mt-2">
					Processing {previewData?.validUpdates || 0} updates across{" "}
					{selectedComponents.length} components
				</p>
			</div>

			<div className="space-y-2">
				<Progress value={progress} className="w-full h-2" />
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>Progress</span>
					<span>{progress}%</span>
				</div>
			</div>
		</div>
	);

	const renderCompleteStep = () => (
		<div className="space-y-4 py-4">
			<div className="text-center">
				<Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
				<h4 className="text-lg font-medium">Update Complete</h4>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="text-center p-4 bg-green-50 rounded-lg">
					<div className="text-2xl font-bold text-green-600">
						{result?.successful || 0}
					</div>
					<div className="text-sm text-green-700">Successful</div>
				</div>
				<div className="text-center p-4 bg-red-50 rounded-lg">
					<div className="text-2xl font-bold text-red-600">
						{result?.failed || 0}
					</div>
					<div className="text-sm text-red-700">Failed</div>
				</div>
			</div>

			{result?.transactionId && (
				<div className="text-center">
					<Badge status="info" className="text-xs">
						Transaction ID: {result.transactionId}
					</Badge>
				</div>
			)}
		</div>
	);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Bulk Milestone Update
					</DialogTitle>
					<DialogDescription>
						Update milestones across {selectedComponents.length}{" "}
						selected components
					</DialogDescription>
				</DialogHeader>

				{/* Progress indicator */}
				<div className="flex items-center justify-center space-x-2 py-2">
					{["configure", "preview", "execute", "complete"].map(
						(step, index) => {
							const isActive = step === currentStep;
							const isCompleted =
								[
									"configure",
									"preview",
									"execute",
									"complete",
								].indexOf(currentStep) > index;

							return (
								<div key={step} className="flex items-center">
									<div
										className={cn(
											"w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
											isActive
												? "bg-blue-600 text-white"
												: isCompleted
													? "bg-green-600 text-white"
													: "bg-gray-200 text-gray-600",
										)}
									>
										{index + 1}
									</div>
									{index < 3 && (
										<div
											className={cn(
												"w-8 h-0.5 mx-1",
												isCompleted
													? "bg-green-600"
													: "bg-gray-200",
											)}
										/>
									)}
								</div>
							);
						},
					)}
				</div>

				<div className="flex-1 overflow-y-auto">
					{currentStep === "configure" && renderConfigurationStep()}
					{currentStep === "preview" && renderPreviewStep()}
					{currentStep === "execute" && renderExecuteStep()}
					{currentStep === "complete" && renderCompleteStep()}
				</div>

				<DialogFooter className="flex items-center justify-between">
					<div>
						{currentStep !== "configure" &&
							currentStep !== "complete" && (
								<Button
									variant="outline"
									onClick={() => setCurrentStep("configure")}
									disabled={isLoading}
								>
									Back
								</Button>
							)}
					</div>

					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
						>
							{currentStep === "complete" ? "Close" : "Cancel"}
						</Button>

						{currentStep === "configure" && (
							<Button
								onClick={handlePreview}
								disabled={
									isLoading ||
									Object.values(milestoneConfigs).every(
										(c) => !c.enabled,
									)
								}
							>
								Preview Changes
							</Button>
						)}

						{currentStep === "preview" && (
							<Button
								onClick={handleExecute}
								disabled={
									isLoading || !previewData?.validUpdates
								}
							>
								<Play className="h-4 w-4 mr-2" />
								Execute Updates
							</Button>
						)}

						{currentStep === "complete" &&
							result?.transactionId && (
								<Button
									variant="outline"
									onClick={() => {
										// TODO: Implement undo functionality
										toast.info(
											"Undo2 functionality coming soon",
										);
									}}
								>
									<Undo2 className="h-4 w-4 mr-2" />
									Undo2
								</Button>
							)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
