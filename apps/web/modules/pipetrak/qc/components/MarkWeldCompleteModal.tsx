"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { Calendar } from "@ui/components/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import { format } from "date-fns";
import { AlertTriangle, Calendar as CalendarIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useWelders } from "../hooks/useWelders";

interface MarkWeldCompleteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fieldWeld: {
		id: string;
		weldIdNumber: string;
		projectId: string;
	};
	onSuccess?: () => void;
	onMilestoneUpdate?: (welderId: string, dateWelded: Date) => Promise<void>;
}

interface CompleteWeldFormData {
	welderId: string;
	dateWelded: Date | undefined;
	comments?: string;
}

export function MarkWeldCompleteModal({
	open,
	onOpenChange,
	fieldWeld,
	onSuccess,
	onMilestoneUpdate,
}: MarkWeldCompleteModalProps) {
	console.log("MarkWeldCompleteModal props:", { fieldWeld, open });
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [formData, setFormData] = useState<CompleteWeldFormData>({
		welderId: "",
		dateWelded: new Date(),
		comments: "",
	});

	// Fetch active welders for this project
	const { data: welders = [], isLoading: weldersLoading } = useWelders({
		projectId: fieldWeld.projectId,
		active: true,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		console.log("MarkWeldCompleteModal handleSubmit called with:", {
			fieldWeldId: fieldWeld.id,
			weldIdNumber: fieldWeld.weldIdNumber,
			projectId: fieldWeld.projectId,
			formData
		});

		// Validate required fields
		const validationErrors: string[] = [];
		
		// Check if fieldWeld.id is missing (this is the root cause of the bug)
		if (!fieldWeld.id) {
			validationErrors.push("Field weld ID is missing. Cannot complete weld without a valid weld record.");
			console.error("Field weld ID is undefined:", fieldWeld);
		}

		if (!formData.welderId) {
			validationErrors.push("Please select a welder.");
		}

		if (!formData.dateWelded) {
			validationErrors.push("Please select the date welded.");
		}

		if (welders.length === 0) {
			validationErrors.push(
				"No active welders are available. Please add welders first.",
			);
		}

		// Validate comment length
		if (formData.comments && formData.comments.length > 500) {
			validationErrors.push("Comments cannot exceed 500 characters.");
		}

		if (validationErrors.length > 0) {
			setErrors(validationErrors);
			return;
		}

		setErrors([]);
		setLoading(true);

		try {
			// Update the field weld record
			const response = await fetch(
				`/api/pipetrak/field-welds/${fieldWeld.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						welderId: formData.welderId,
						dateWelded: formData.dateWelded?.toISOString(),
						comments: formData.comments?.trim() || undefined,
					}),
				},
			);

			if (response.ok) {
				// If we have a milestone update callback, call it as well
				if (onMilestoneUpdate && formData.welderId && formData.dateWelded) {
					await onMilestoneUpdate(formData.welderId, formData.dateWelded);
				}

				toast.success("Weld marked as complete successfully");
				onSuccess?.();
				onOpenChange(false);
				// Reset form
				setFormData({
					welderId: "",
					dateWelded: new Date(),
					comments: "",
				});
			} else {
				const error = await response.json();
				console.error("Failed to mark weld complete. Response status:", response.status);
				console.error("Error details:", error);
				setErrors([
					error.message ||
						"Failed to mark weld as complete. Please try again.",
				]);
			}
		} catch (error) {
			console.error("Error marking weld complete:", error);
			console.error("Error details:", error instanceof Error ? error.message : error);
			setErrors(["An unexpected error occurred. Please try again."]);
		} finally {
			setLoading(false);
		}
	};

	const updateFormData = (field: keyof CompleteWeldFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const remainingChars = 500 - (formData.comments?.length || 0);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Check className="h-5 w-5 text-green-600" />
						Mark Weld Complete
					</DialogTitle>
					<DialogDescription>
						Mark weld{" "}
						<span className="font-mono font-medium">
							{fieldWeld.weldIdNumber}
						</span>{" "}
						as complete with welder and date information
					</DialogDescription>
				</DialogHeader>

				{errors.length > 0 && (
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							<ul className="list-disc list-inside space-y-1">
								{errors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Date Welded */}
					<div className="space-y-2">
						<Label>Date Welded *</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-full justify-start text-left font-normal",
										!formData.dateWelded &&
											"text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{formData.dateWelded ? (
										format(formData.dateWelded, "PPP")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0"
								align="start"
							>
								<Calendar
									mode="single"
									selected={formData.dateWelded}
									onSelect={(date) =>
										updateFormData("dateWelded", date)
									}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Welder Selection */}
					<div className="space-y-2">
						<Label htmlFor="welder">Welder *</Label>
						<Select
							value={formData.welderId}
							onValueChange={(value) =>
								updateFormData("welderId", value)
							}
							required
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										weldersLoading
											? "Loading welders..."
											: "Select welder"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{welders.map((welder) => (
									<SelectItem
										key={welder.id}
										value={welder.id}
									>
										<div className="flex items-center gap-2">
											<span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
												{welder.stencil}
											</span>
											<span>{welder.name}</span>
										</div>
									</SelectItem>
								))}
								{!weldersLoading && welders.length === 0 && (
									<SelectItem value="" disabled>
										No active welders found
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						{welders.length === 0 && !weldersLoading && (
							<Alert variant="destructive" className="mt-2">
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription className="text-sm">
									No active welders available. Add welders in
									the Welders section first.
								</AlertDescription>
							</Alert>
						)}
					</div>

					{/* Comments */}
					<div className="space-y-2">
						<Label htmlFor="comments">Comments</Label>
						<Textarea
							id="comments"
							value={formData.comments || ""}
							onChange={(e) =>
								updateFormData("comments", e.target.value)
							}
							placeholder="Additional notes or observations..."
							maxLength={500}
							className="resize-none"
						/>
						<div className="text-xs text-muted-foreground text-right">
							{remainingChars} characters remaining
						</div>
					</div>

					{/* Actions */}
					<div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							size="lg"
							onClick={() => onOpenChange(false)}
							disabled={loading}
							className="min-h-[44px]"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="lg"
							disabled={loading || welders.length === 0}
							className="min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
						>
							<Check className="mr-2 h-4 w-4" />
							{loading ? "Saving..." : "Mark Complete"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
