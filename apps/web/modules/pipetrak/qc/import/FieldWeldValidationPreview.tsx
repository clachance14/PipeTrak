"use client";

import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
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
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	Download,
	Eye,
	EyeOff,
	FileSpreadsheet,
	Filter,
	Info,
	RotateCcw,
	Upload,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// Import validation types
export interface ValidationError {
	row: number;
	field: string;
	error: string;
	value: any;
}

export enum ValidationCategory {
	ERROR = "error",
	WARNING = "warning",
	INFO = "info",
}

export interface FieldWeldValidationError extends ValidationError {
	category: ValidationCategory;
	recommendation?: string;
	code: string;
}

export interface FieldWeldValidationReport {
	isValid: boolean;
	summary: {
		totalRows: number;
		validRows: number;
		invalidRows: number;
		errorCount: number;
		warningCount: number;
		infoCount: number;
	};
	errors: FieldWeldValidationError[];
	warnings: FieldWeldValidationError[];
	infos: FieldWeldValidationError[];
	validRows: any[];
	invalidRows: any[];
	duplicateWeldIds: string[];
	missingDrawings: string[];
	inheritanceApplied: {
		testPressure: number;
		specCode: number;
	};
	recommendations: string[];
}

interface FilterState {
	category: string;
	field: string;
	code: string;
	search: string;
	showOnlyErrors: boolean;
}

interface SortState {
	field: string;
	direction: "asc" | "desc" | null;
}

interface FieldWeldValidationPreviewProps {
	validationReport: FieldWeldValidationReport;
	fileName: string;
	onRetryUpload: () => void;
	onProceedToImport?: () => void;
	onExportValidationReport?: () => void;
	className?: string;
}

const DEFAULT_FILTERS: FilterState = {
	category: "all",
	field: "all",
	code: "all",
	search: "",
	showOnlyErrors: false,
};

export function FieldWeldValidationPreview({
	validationReport,
	fileName,
	onRetryUpload,
	onProceedToImport,
	onExportValidationReport,
	className,
}: FieldWeldValidationPreviewProps) {
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [sortState, setSortState] = useState<SortState>({
		field: "row",
		direction: "asc",
	});
	const [expandedRecommendations, setExpandedRecommendations] =
		useState(false);

	// Combine all validation issues
	const allIssues = useMemo(
		() => [
			...validationReport.errors,
			...validationReport.warnings,
			...validationReport.infos,
		],
		[validationReport],
	);

	// Get unique values for filter options
	const filterOptions = useMemo(() => {
		const categories = Array.from(
			new Set(allIssues.map((issue) => issue.category)),
		).sort();
		const fields = Array.from(
			new Set(allIssues.map((issue) => issue.field)),
		).sort();
		const codes = Array.from(
			new Set(allIssues.map((issue) => issue.code)),
		).sort();

		return { categories, fields, codes };
	}, [allIssues]);

	// Filter and sort issues
	const filteredAndSortedIssues = useMemo(() => {
		let filtered = allIssues;

		// Apply filters
		if (filters.category !== "all") {
			filtered = filtered.filter(
				(issue) => issue.category === filters.category,
			);
		}

		if (filters.field !== "all") {
			filtered = filtered.filter(
				(issue) => issue.field === filters.field,
			);
		}

		if (filters.code !== "all") {
			filtered = filtered.filter((issue) => issue.code === filters.code);
		}

		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			filtered = filtered.filter(
				(issue) =>
					issue.error.toLowerCase().includes(searchLower) ||
					issue.field.toLowerCase().includes(searchLower) ||
					issue.recommendation?.toLowerCase().includes(searchLower) ||
					issue.value?.toString().toLowerCase().includes(searchLower),
			);
		}

		if (filters.showOnlyErrors) {
			filtered = filtered.filter(
				(issue) => issue.category === ValidationCategory.ERROR,
			);
		}

		// Apply sorting
		if (sortState.field && sortState.direction) {
			filtered.sort((a, b) => {
				let aValue: any;
				let bValue: any;

				switch (sortState.field) {
					case "row":
						aValue = a.row;
						bValue = b.row;
						break;
					case "field":
						aValue = a.field;
						bValue = b.field;
						break;
					case "category":
						aValue = a.category;
						bValue = b.category;
						break;
					case "code":
						aValue = a.code;
						bValue = b.code;
						break;
					case "error":
						aValue = a.error;
						bValue = b.error;
						break;
					default:
						return 0;
				}

				if (typeof aValue === "string" && typeof bValue === "string") {
					aValue = aValue.toLowerCase();
					bValue = bValue.toLowerCase();
				}

				if (aValue < bValue)
					return sortState.direction === "asc" ? -1 : 1;
				if (aValue > bValue)
					return sortState.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [allIssues, filters, sortState]);

	const handleSort = useCallback((field: string) => {
		setSortState((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc"
					? "desc"
					: "asc",
		}));
	}, []);

	const handleFilterChange = useCallback(
		(key: keyof FilterState, value: any) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const clearFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
	}, []);

	const getCategoryIcon = (category: ValidationCategory) => {
		switch (category) {
			case ValidationCategory.ERROR:
				return <XCircle className="h-4 w-4 text-red-500" />;
			case ValidationCategory.WARNING:
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
			case ValidationCategory.INFO:
				return <Info className="h-4 w-4 text-blue-500" />;
			default:
				return <Info className="h-4 w-4" />;
		}
	};

	const getCategoryBadgeVariant = (category: ValidationCategory) => {
		switch (category) {
			case ValidationCategory.ERROR:
				return "destructive" as const;
			case ValidationCategory.WARNING:
				return "secondary" as const; // Will be styled as warning
			case ValidationCategory.INFO:
				return "outline" as const;
			default:
				return "outline" as const;
		}
	};

	const getSortIcon = (field: string) => {
		if (sortState.field !== field)
			return <ArrowUpDown className="h-3 w-3" />;
		return sortState.direction === "asc" ? (
			<ArrowUp className="h-3 w-3" />
		) : (
			<ArrowDown className="h-3 w-3" />
		);
	};

	const hasActiveFilters =
		filters.category !== "all" ||
		filters.field !== "all" ||
		filters.code !== "all" ||
		filters.search !== "" ||
		filters.showOnlyErrors;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Validation Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<FileSpreadsheet className="h-5 w-5 text-blue-500" />
							<span className="text-sm font-medium">
								Total Rows
							</span>
						</div>
						<div className="text-2xl font-bold">
							{validationReport.summary.totalRows}
						</div>
						<p className="text-xs text-muted-foreground">
							{fileName}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<Check className="h-5 w-5 text-green-500" />
							<span className="text-sm font-medium">
								Valid Rows
							</span>
						</div>
						<div className="text-2xl font-bold text-green-600">
							{validationReport.summary.validRows}
						</div>
						<p className="text-xs text-muted-foreground">
							{(
								(validationReport.summary.validRows /
									validationReport.summary.totalRows) *
								100
							).toFixed(1)}
							% success rate
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<XCircle className="h-5 w-5 text-red-500" />
							<span className="text-sm font-medium">Errors</span>
						</div>
						<div className="text-2xl font-bold text-red-600">
							{validationReport.summary.errorCount}
						</div>
						<p className="text-xs text-muted-foreground">
							Must be fixed to proceed
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<AlertTriangle className="h-5 w-5 text-yellow-500" />
							<span className="text-sm font-medium">
								Warnings
							</span>
						</div>
						<div className="text-2xl font-bold text-yellow-600">
							{validationReport.summary.warningCount}
						</div>
						<p className="text-xs text-muted-foreground">
							Review recommended
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Inheritance Information */}
			{(validationReport.inheritanceApplied.testPressure > 0 ||
				validationReport.inheritanceApplied.specCode > 0) && (
				<Alert>
					<Info className="h-4 w-4" />
					<AlertTitle>Values Inherited from Drawings</AlertTitle>
					<AlertDescription>
						<div className="mt-2 space-y-1">
							{validationReport.inheritanceApplied.testPressure >
								0 && (
								<p>
									• Test Pressure inherited for{" "}
									{
										validationReport.inheritanceApplied
											.testPressure
									}{" "}
									welds
								</p>
							)}
							{validationReport.inheritanceApplied.specCode >
								0 && (
								<p>
									• Spec Code inherited for{" "}
									{
										validationReport.inheritanceApplied
											.specCode
									}{" "}
									welds
								</p>
							)}
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Recommendations */}
			{validationReport.recommendations.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-yellow-500" />
								Action Required
							</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setExpandedRecommendations(
										!expandedRecommendations,
									)
								}
							>
								{expandedRecommendations ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div
							className={cn(
								"space-y-2",
								!expandedRecommendations &&
									validationReport.recommendations.length >
										3 &&
									"max-h-24 overflow-hidden",
							)}
						>
							{validationReport.recommendations.map(
								(recommendation, index) => (
									<div
										key={index}
										className="flex items-start gap-2"
									>
										<span className="text-sm font-medium text-muted-foreground min-w-4">
											{index + 1}.
										</span>
										<p className="text-sm">
											{recommendation}
										</p>
									</div>
								),
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Filter Bar */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<Filter className="h-5 w-5" />
							Validation Details
							<Badge status="info" className="ml-2">
								{filteredAndSortedIssues.length} of{" "}
								{allIssues.length}
							</Badge>
						</CardTitle>

						<div className="flex items-center gap-2">
							{onExportValidationReport && (
								<Button
									variant="outline"
									size="sm"
									onClick={onExportValidationReport}
									className="text-blue-600"
								>
									<Download className="h-4 w-4 mr-2" />
									Export CSV
								</Button>
							)}

							{hasActiveFilters && (
								<Button
									variant="outline"
									size="sm"
									onClick={clearFilters}
								>
									<RotateCcw className="h-4 w-4 mr-2" />
									Clear Filters
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Filter Controls */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="space-y-1">
							<label className="text-sm font-medium">
								Category
							</label>
							<Select
								value={filters.category}
								onValueChange={(value) =>
									handleFilterChange("category", value)
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Categories
									</SelectItem>
									{filterOptions.categories.map(
										(category) => (
											<SelectItem
												key={category}
												value={category}
											>
												<div className="flex items-center gap-2">
													{getCategoryIcon(
														category as ValidationCategory,
													)}
													{category
														.charAt(0)
														.toUpperCase() +
														category.slice(1)}
												</div>
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">Field</label>
							<Select
								value={filters.field}
								onValueChange={(value) =>
									handleFilterChange("field", value)
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Fields
									</SelectItem>
									{filterOptions.fields.map((field) => (
										<SelectItem key={field} value={field}>
											{field}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">
								Error Code
							</label>
							<Select
								value={filters.code}
								onValueChange={(value) =>
									handleFilterChange("code", value)
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Codes
									</SelectItem>
									{filterOptions.codes.map((code) => (
										<SelectItem key={code} value={code}>
											{code}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">
								Search
							</label>
							<div className="relative">
								<Input
									placeholder="Search errors..."
									value={filters.search}
									onChange={(e) =>
										handleFilterChange(
											"search",
											e.target.value,
										)
									}
									className="h-9 pr-8"
								/>
								{filters.search && (
									<Button
										variant="ghost"
										size="sm"
										className="absolute right-1 top-1 h-7 w-7 p-0"
										onClick={() =>
											handleFilterChange("search", "")
										}
									>
										<X className="h-3 w-3" />
									</Button>
								)}
							</div>
						</div>
					</div>

					{/* Quick Filters */}
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant={
								filters.showOnlyErrors ? "default" : "outline"
							}
							size="sm"
							onClick={() =>
								handleFilterChange(
									"showOnlyErrors",
									!filters.showOnlyErrors,
								)
							}
							className="h-8"
						>
							<XCircle className="h-3 w-3 mr-2" />
							Errors Only
						</Button>
					</div>

					{/* Validation Issues Table */}
					<div className="border rounded-lg overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead
										className="w-16 cursor-pointer hover:bg-muted/70"
										onClick={() => handleSort("row")}
									>
										<div className="flex items-center gap-1">
											Row
											{getSortIcon("row")}
										</div>
									</TableHead>
									<TableHead
										className="w-32 cursor-pointer hover:bg-muted/70"
										onClick={() => handleSort("field")}
									>
										<div className="flex items-center gap-1">
											Field
											{getSortIcon("field")}
										</div>
									</TableHead>
									<TableHead
										className="w-24 cursor-pointer hover:bg-muted/70"
										onClick={() => handleSort("category")}
									>
										<div className="flex items-center gap-1">
											Type
											{getSortIcon("category")}
										</div>
									</TableHead>
									<TableHead className="min-w-0 flex-1">
										Message
									</TableHead>
									<TableHead className="w-32">
										Value
									</TableHead>
									<TableHead className="w-24">Code</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAndSortedIssues.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center py-12 text-muted-foreground"
										>
											{hasActiveFilters
												? "No validation issues match your filters"
												: "No validation issues found"}
										</TableCell>
									</TableRow>
								) : (
									filteredAndSortedIssues.map(
										(issue, index) => (
											<TableRow
												key={index}
												className="group"
											>
												<TableCell className="font-mono text-sm">
													{issue.row}
												</TableCell>
												<TableCell className="font-medium">
													{issue.field}
												</TableCell>
												<TableCell>
													<Badge
														variant={getCategoryBadgeVariant(
															issue.category,
														)}
														className={cn(
															"text-xs",
															issue.category ===
																ValidationCategory.WARNING &&
																"bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
														)}
													>
														<div className="flex items-center gap-1">
															{getCategoryIcon(
																issue.category,
															)}
															{issue.category}
														</div>
													</Badge>
												</TableCell>
												<TableCell className="min-w-0">
													<div className="space-y-1">
														<p className="text-sm">
															{issue.error}
														</p>
														{issue.recommendation && (
															<p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
																💡{" "}
																{
																	issue.recommendation
																}
															</p>
														)}
													</div>
												</TableCell>
												<TableCell className="max-w-32">
													{issue.value !== null &&
													issue.value !==
														undefined ? (
														<code className="text-xs bg-muted px-1 py-0.5 rounded break-all">
															{String(
																issue.value,
															)}
														</code>
													) : (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													)}
												</TableCell>
												<TableCell>
													<code className="text-xs text-muted-foreground">
														{issue.code}
													</code>
												</TableCell>
											</TableRow>
										),
									)
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex items-center justify-between gap-4">
				<Button
					variant="outline"
					onClick={onRetryUpload}
					className="flex-1 sm:flex-none"
				>
					<Upload className="h-4 w-4 mr-2" />
					Fix and Re-upload
				</Button>

				<div className="flex items-center gap-2">
					{validationReport.summary.errorCount > 0 ? (
						<Alert className="inline-flex p-2 border-red-200">
							<XCircle className="h-4 w-4 text-red-500 mr-2" />
							<span className="text-sm">
								Fix {validationReport.summary.errorCount} errors
								to proceed
							</span>
						</Alert>
					) : (
						onProceedToImport && (
							<Button
								onClick={onProceedToImport}
								className="flex-1 sm:flex-none"
							>
								<Check className="h-4 w-4 mr-2" />
								Proceed to Import (
								{validationReport.summary.validRows} rows)
							</Button>
						)
					)}
				</div>
			</div>
		</div>
	);
}
