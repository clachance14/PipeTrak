"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@ui/components/textarea";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
import { Package, MapPin, Wrench, FileText, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ComponentWithMilestones } from "../../types";
import { AutocompleteField } from "./AutocompleteField";

interface BulkUpdateModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedComponents: ComponentWithMilestones[];
	onUpdate: (updates: any) => Promise<void>;
	projectId: string;
}

export function BulkUpdateModal({
	isOpen,
	onClose,
	selectedComponents,
	onUpdate,
	projectId,
}: BulkUpdateModalProps) {
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateProgress, setUpdateProgress] = useState(0);

	// Track which fields to update
	const [fieldsToUpdate, setFieldsToUpdate] = useState({
		area: false,
		system: false,
		testPackage: false,
		description: false,
	});

	// Field values
	const [fieldValues, setFieldValues] = useState({
		area: "",
		system: "",
		testPackage: "",
		description: "",
	});

	// All available field values from the entire project
	const [allFieldValues, setAllFieldValues] = useState({
		areas: [] as string[],
		systems: [] as string[],
		testPackages: [] as string[],
	});

	// Fetch all field values when modal opens
	useEffect(() => {
		if (isOpen && projectId) {
			// Fetch all components from the project to get all possible field values
			fetch(`/api/pipetrak/components?projectId=${projectId}&limit=10000`)
				.then((res) => res.json())
				.then((data) => {
					const components = data.data || [];

					// Extract unique values for each field
					const areas = [
						...new Set(
							components
								.map((c: any) => c.area)
								.filter(
									(value: any) =>
										value && typeof value === "string",
								)
								.filter(
									(value: string) => value.trim().length > 0,
								),
						),
					].sort();

					const systems = [
						...new Set(
							components
								.map((c: any) => c.system)
								.filter(
									(value: any) =>
										value && typeof value === "string",
								)
								.filter(
									(value: string) => value.trim().length > 0,
								),
						),
					].sort();

					const testPackages = [
						...new Set(
							components
								.map((c: any) => c.testPackage)
								.filter(
									(value: any) =>
										value && typeof value === "string",
								)
								.filter(
									(value: string) => value.trim().length > 0,
								),
						),
					].sort();

					setAllFieldValues({
						areas,
						systems,
						testPackages,
					});
				})
				.catch((error) => {
					console.error("Failed to fetch field values:", error);
					// Fallback to empty arrays
					setAllFieldValues({
						areas: [],
						systems: [],
						testPackages: [],
					});
				});
		}
	}, [isOpen, projectId]);

	const handleFieldToggle = (field: string) => {
		setFieldsToUpdate((prev) => ({
			...prev,
			[field]: !prev[field as keyof typeof prev],
		}));
	};

	const handleFieldChange = (field: string, value: string) => {
		setFieldValues((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleBulkUpdate = async () => {
		// Prepare updates object with only selected fields
		const updates: any = {};
		Object.keys(fieldsToUpdate).forEach((field) => {
			if (
				fieldsToUpdate[field as keyof typeof fieldsToUpdate] &&
				fieldValues[field as keyof typeof fieldValues] !== "NO_CHANGE"
			) {
				updates[field] = fieldValues[field as keyof typeof fieldValues];
			}
		});

		if (Object.keys(updates).length === 0) {
			toast.error("Please select at least one field to update");
			return;
		}

		setIsUpdating(true);
		setUpdateProgress(0);

		try {
			// Simulate progress for UX
			const progressInterval = setInterval(() => {
				setUpdateProgress((prev) => Math.min(prev + 10, 90));
			}, 200);

			await onUpdate(updates);

			clearInterval(progressInterval);
			setUpdateProgress(100);

			toast.success(
				`Successfully updated ${selectedComponents.length} components`,
			);

			// Reset form and close
			setTimeout(() => {
				onClose();
				setFieldsToUpdate({
					area: false,
					system: false,
					testPackage: false,
					description: false,
				});
				setFieldValues({
					area: "",
					system: "",
					testPackage: "",
					description: "",
				});
				setUpdateProgress(0);
			}, 500);
		} catch (error) {
			toast.error("Failed to update components");
			console.error("Bulk update error:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Get unique values from selected components for preview
	const getUniqueValues = (
		field: keyof ComponentWithMilestones,
	): string[] => {
		const values = new Set(
			selectedComponents
				.map((c) => c[field])
				.filter(Boolean)
				.filter((value): value is string => typeof value === "string"),
		);
		return Array.from(values);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Bulk Update Components
					</DialogTitle>
					<DialogDescription>
						Update {selectedComponents.length} selected component
						{selectedComponents.length !== 1 ? "s" : ""}. Select the
						fields you want to update.
					</DialogDescription>
				</DialogHeader>

				{isUpdating ? (
					<div className="py-8 space-y-4">
						<div className="text-center">
							<Clock className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
							<p className="text-lg font-medium">
								Updating Components...
							</p>
							<p className="text-sm text-muted-foreground mt-2">
								Processing {selectedComponents.length}{" "}
								components
							</p>
						</div>
						<Progress value={updateProgress} className="w-full" />
					</div>
				) : (
					<div className="space-y-6 py-4">
						{/* Selected Components Summary */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h4 className="font-medium mb-2">
								Selected Components
							</h4>
							<div className="flex flex-wrap gap-2">
								{selectedComponents.slice(0, 5).map((comp) => (
									<Badge key={comp.id} status="info">
										{comp.componentId}
									</Badge>
								))}
								{selectedComponents.length > 5 && (
									<Badge status="info">
										+{selectedComponents.length - 5} more
									</Badge>
								)}
							</div>
						</div>

						{/* Update Fields */}
						<div className="space-y-4">
							{/* Area Update */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Checkbox
										checked={fieldsToUpdate.area}
										onCheckedChange={() =>
											handleFieldToggle("area")
										}
									/>
									<Label className="flex items-center gap-2">
										<MapPin className="h-4 w-4" />
										Area
									</Label>
									{getUniqueValues("area").length > 0 && (
										<span className="text-xs text-muted-foreground">
											Current:{" "}
											{getUniqueValues("area").join(", ")}
										</span>
									)}
								</div>
								{fieldsToUpdate.area && (
									<AutocompleteField
										value={fieldValues.area}
										onValueChange={(value) =>
											handleFieldChange("area", value)
										}
										options={allFieldValues.areas}
										placeholder="Select existing area or enter new one"
									/>
								)}
							</div>

							{/* System Update */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Checkbox
										checked={fieldsToUpdate.system}
										onCheckedChange={() =>
											handleFieldToggle("system")
										}
									/>
									<Label className="flex items-center gap-2">
										<Package className="h-4 w-4" />
										System
									</Label>
									{getUniqueValues("system").length > 0 && (
										<span className="text-xs text-muted-foreground">
											Current:{" "}
											{getUniqueValues("system").join(
												", ",
											)}
										</span>
									)}
								</div>
								{fieldsToUpdate.system && (
									<AutocompleteField
										value={fieldValues.system}
										onValueChange={(value) =>
											handleFieldChange("system", value)
										}
										options={allFieldValues.systems}
										placeholder="Select existing system or enter new one"
									/>
								)}
							</div>

							{/* Test Package Update */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Checkbox
										checked={fieldsToUpdate.testPackage}
										onCheckedChange={() =>
											handleFieldToggle("testPackage")
										}
									/>
									<Label className="flex items-center gap-2">
										<Wrench className="h-4 w-4" />
										Test Package
									</Label>
									{getUniqueValues("testPackage").length >
										0 && (
										<span className="text-xs text-muted-foreground">
											Current:{" "}
											{getUniqueValues(
												"testPackage",
											).join(", ")}
										</span>
									)}
								</div>
								{fieldsToUpdate.testPackage && (
									<AutocompleteField
										value={fieldValues.testPackage}
										onValueChange={(value) =>
											handleFieldChange(
												"testPackage",
												value,
											)
										}
										options={allFieldValues.testPackages}
										placeholder="Select existing test package or enter new one"
									/>
								)}
							</div>

							{/* Description Update */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Checkbox
										checked={fieldsToUpdate.description}
										onCheckedChange={() =>
											handleFieldToggle("description")
										}
									/>
									<Label className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
										Description
									</Label>
								</div>
								{fieldsToUpdate.description && (
									<Textarea
										value={fieldValues.description}
										onChange={(e) =>
											handleFieldChange(
												"description",
												e.target.value,
											)
										}
										placeholder="Enter new description"
										rows={3}
									/>
								)}
							</div>
						</div>
					</div>
				)}

				{!isUpdating && (
					<DialogFooter>
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleBulkUpdate}
							disabled={Object.values(fieldsToUpdate).every(
								(v) => !v,
							)}
						>
							Update {selectedComponents.length} Components
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
