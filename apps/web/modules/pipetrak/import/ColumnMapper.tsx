"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	AlertCircle,
	ArrowRight,
	FileSpreadsheet,
	Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { parseFileHeaders } from "../utils/fileParser";

interface ColumnMapperProps {
	file: File;
	projectId: string;
	importType: "components" | "field_welds";
	onMappingComplete: (mappings: Record<string, string>) => void;
	onBack: () => void;
}

// Component fields that can be mapped - matches actual database schema
const COMPONENT_FIELDS = [
	// Required fields
	{
		value: "componentId",
		label: "Component ID",
		required: true,
		description: "Part number or commodity code",
	},
	{
		value: "type",
		label: "Component Type",
		required: true,
		description: "VALVE, FITTING, GASKET, SUPPORT, FIELD_WELD, etc.",
	},
	{
		value: "drawingId",
		label: "Drawing ID",
		required: true,
		description: "Drawing number this component belongs to",
	},

	// Physical attributes
	{ value: "spec", label: "Specification", required: false },
	{
		value: "size",
		label: "Size / Weld Size",
		required: false,
		description: "Component size or weld diameter",
	},
	{
		value: "material",
		label: "Material / Base Metal",
		required: false,
		description: "Material specification or base metal for welds",
	},
	{
		value: "pressureRating",
		label: "Pressure Rating / Schedule",
		required: false,
		description: "Pressure rating or pipe schedule",
	},
	{ value: "description", label: "Description", required: false },

	// Organizational attributes
	{ value: "area", label: "Area", required: false },
	{ value: "system", label: "System", required: false },
	{ value: "testPackage", label: "Test Package", required: false },
	{ value: "testPressure", label: "Test Pressure", required: false },
	{ value: "testRequired", label: "Test Required", required: false },
	{
		value: "totalQuantity",
		label: "Quantity",
		required: false,
		description: "Number of identical instances to create (defaults to 1)",
	},
];

// Field weld-specific fields (shown when FIELD_WELD components are detected)
const FIELD_WELD_FIELDS = [
	// Field weld identifier
	{
		value: "weldId",
		label: "Weld ID",
		required: false,
		description: "Unique weld identifier (required for field welds)",
	},
	// Weld-specific QC fields
	{
		value: "weldSize",
		label: "Weld Size",
		required: false,
		description: "Weld diameter (can map to 'size' if not specified)",
	},
	{
		value: "schedule",
		label: "Schedule",
		required: false,
		description:
			"Pipe schedule (can map to 'pressureRating' if not specified)",
	},
	{
		value: "weldTypeCode",
		label: "Weld Type Code",
		required: false,
		description: "BW, SW, TW, etc.",
	},
	{
		value: "baseMetal",
		label: "Base Metal",
		required: false,
		description:
			"Material being welded (can map to 'material' if not specified)",
	},
	{
		value: "xrayPercent",
		label: "X-ray Percent",
		required: false,
		description: "Percentage requiring RT (0-100)",
	},
	{
		value: "pwhtRequired",
		label: "PWHT Required",
		required: false,
		description: "TRUE/FALSE for post-weld heat treatment",
	},
	{
		value: "ndeTypes",
		label: "NDE Types",
		required: false,
		description: "RT,PT,MT,UT,VT (comma-separated)",
	},
	{
		value: "welderId",
		label: "Welder Stencil",
		required: false,
		description: "Welder identification",
	},
	{
		value: "dateWelded",
		label: "Date Welded",
		required: false,
		description: "YYYY-MM-DD format",
	},
	{
		value: "tieInNumber",
		label: "Tie-In Number",
		required: false,
		description: "Connection reference",
	},
	{
		value: "comments",
		label: "Comments",
		required: false,
		description: "Additional weld notes",
	},
];

export function ColumnMapper({
	file,
	projectId: _projectId,
	importType,
	onMappingComplete,
	onBack,
}: ColumnMapperProps) {
	const [fileHeaders, setFileHeaders] = useState<string[]>([]);
	const [mappings, setMappings] = useState<Record<string, string>>({});
	const [autoMapped, setAutoMapped] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [parseError, setParseError] = useState<string | null>(null);
	const [hasFieldWelds, setHasFieldWelds] = useState(false);

	useEffect(() => {
		parseFile();
	}, [file]);

	const parseFile = async () => {
		try {
			setIsLoading(true);
			const { headers, sampleData } = await parseFileHeaders(file);
			console.log("Parsed headers from Excel file:", headers);
			console.log("Sample data rows:", sampleData?.slice(0, 3));
			setFileHeaders(headers);

			// Auto-map obvious matches
			const autoMappings: Record<string, string> = {};
			const mapped = new Set<string>();

			headers.forEach((header) => {
				const normalized = header
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "");
				const headerLower = header.toLowerCase();

				// Try exact matches first
				const fieldsToCheck =
					importType === "field_welds"
						? [...COMPONENT_FIELDS, ...FIELD_WELD_FIELDS]
						: COMPONENT_FIELDS;

				fieldsToCheck.forEach((field) => {
					const fieldNormalized = field.value
						.toLowerCase()
						.replace(/[^a-z0-9]/g, "");
					if (
						normalized === fieldNormalized &&
						!autoMappings[field.value]
					) {
						autoMappings[field.value] = header;
						mapped.add(field.value);
					}
				});

				// Handle specific mapping cases for common Excel template columns
				if (!autoMappings.componentId) {
					if (
						headerLower === "component id" ||
						headerLower === "componentid" ||
						headerLower === "commodity code" ||
						headerLower === "commoditycode" ||
						headerLower === "part number" ||
						headerLower === "tag number" ||
						headerLower === "tag"
					) {
						autoMappings.componentId = header;
						mapped.add("componentId");
						console.log(
							"Auto-mapped column:",
							header,
							"→ componentId",
						);
					}
				}

				// Separate auto-mapping for weld ID (only for field weld imports)
				if (!autoMappings.weldId && importType === "field_welds") {
					if (
						headerLower === "weld id" ||
						headerLower === "weldid" ||
						headerLower === "weld number" ||
						headerLower === "weldnumber"
					) {
						autoMappings.weldId = header;
						mapped.add("weldId");
						console.log("Auto-mapped column:", header, "→ weldId");
					}
				}

				if (!autoMappings.type) {
					if (
						headerLower === "component type" ||
						headerLower === "type" ||
						headerLower === "componenttype"
					) {
						autoMappings.type = header;
						mapped.add("type");
						console.log("Auto-mapped column:", header, "→ type");
					}
				}

				if (!autoMappings.drawingId) {
					if (
						headerLower === "drawing id" ||
						headerLower === "drawingid" ||
						headerLower === "drawing number" ||
						headerLower === "drawing"
					) {
						autoMappings.drawingId = header;
						mapped.add("drawingId");
					}
				}

				if (!autoMappings.spec) {
					if (
						headerLower === "specification" ||
						headerLower === "spec"
					) {
						autoMappings.spec = header;
						mapped.add("spec");
					}
				}

				if (!autoMappings.size) {
					if (headerLower === "size") {
						autoMappings.size = header;
						mapped.add("size");
					}
				}

				if (!autoMappings.material) {
					if (headerLower === "material") {
						autoMappings.material = header;
						mapped.add("material");
					}
				}

				if (!autoMappings.pressureRating) {
					if (
						headerLower === "pressure rating" ||
						headerLower === "pressurerating" ||
						headerLower === "pressure"
					) {
						autoMappings.pressureRating = header;
						mapped.add("pressureRating");
					}
				}

				if (!autoMappings.description) {
					if (
						headerLower === "description" ||
						headerLower === "desc"
					) {
						autoMappings.description = header;
						mapped.add("description");
					}
				}

				if (!autoMappings.area) {
					if (headerLower === "area") {
						autoMappings.area = header;
						mapped.add("area");
					}
				}

				if (!autoMappings.system) {
					if (headerLower === "system") {
						autoMappings.system = header;
						mapped.add("system");
					}
				}

				if (!autoMappings.testPackage) {
					if (
						headerLower === "test package" ||
						headerLower === "testpackage" ||
						headerLower === "test pkg"
					) {
						autoMappings.testPackage = header;
						mapped.add("testPackage");
					}
				}

				if (!autoMappings.testPressure) {
					if (
						headerLower === "test pressure" ||
						headerLower === "testpressure"
					) {
						autoMappings.testPressure = header;
						mapped.add("testPressure");
					}
				}

				if (!autoMappings.testRequired) {
					if (
						headerLower === "test required" ||
						headerLower === "testrequired"
					) {
						autoMappings.testRequired = header;
						mapped.add("testRequired");
					}
				}

				if (!autoMappings.totalQuantity) {
					if (
						headerLower === "quantity" ||
						headerLower === "qty" ||
						headerLower === "total quantity" ||
						headerLower === "totalquantity"
					) {
						autoMappings.totalQuantity = header;
						mapped.add("totalQuantity");
					}
				}

				// Field weld-specific auto-mapping
				if (!autoMappings.weldSize) {
					if (
						headerLower === "weld size" ||
						headerLower === "weldsize"
					) {
						autoMappings.weldSize = header;
						mapped.add("weldSize");
					}
				}

				if (!autoMappings.schedule) {
					if (
						headerLower === "schedule" ||
						headerLower === "sch" ||
						headerLower === "pipe schedule"
					) {
						autoMappings.schedule = header;
						mapped.add("schedule");
					}
				}

				if (!autoMappings.weldTypeCode) {
					if (
						headerLower === "weld type" ||
						headerLower === "weld type code" ||
						headerLower === "weldtype" ||
						headerLower === "weldtypecode"
					) {
						autoMappings.weldTypeCode = header;
						mapped.add("weldTypeCode");
					}
				}

				if (!autoMappings.baseMetal) {
					if (
						headerLower === "base metal" ||
						headerLower === "basemetal"
					) {
						autoMappings.baseMetal = header;
						mapped.add("baseMetal");
					}
				}

				if (!autoMappings.xrayPercent) {
					if (
						headerLower === "x-ray percent" ||
						headerLower === "xray percent" ||
						headerLower === "xraypercent" ||
						headerLower === "rt percent"
					) {
						autoMappings.xrayPercent = header;
						mapped.add("xrayPercent");
					}
				}

				if (!autoMappings.pwhtRequired) {
					if (
						headerLower === "pwht required" ||
						headerLower === "pwht" ||
						headerLower === "pwht req" ||
						headerLower === "pwhtrequired"
					) {
						autoMappings.pwhtRequired = header;
						mapped.add("pwhtRequired");
					}
				}

				if (!autoMappings.ndeTypes) {
					if (
						headerLower === "nde types" ||
						headerLower === "nde" ||
						headerLower === "ndetypes" ||
						headerLower === "nde methods"
					) {
						autoMappings.ndeTypes = header;
						mapped.add("ndeTypes");
					}
				}

				if (!autoMappings.welderId) {
					if (
						headerLower === "welder" ||
						headerLower === "welder stencil" ||
						headerLower === "welder id" ||
						headerLower === "welderid" ||
						headerLower === "stencil"
					) {
						autoMappings.welderId = header;
						mapped.add("welderId");
					}
				}

				if (!autoMappings.dateWelded) {
					if (
						headerLower === "date welded" ||
						headerLower === "weld date" ||
						headerLower === "datewelded" ||
						headerLower === "welddate"
					) {
						autoMappings.dateWelded = header;
						mapped.add("dateWelded");
					}
				}

				if (!autoMappings.tieInNumber) {
					if (
						headerLower === "tie-in number" ||
						headerLower === "tie in" ||
						headerLower === "tiein" ||
						headerLower === "tieinnumber"
					) {
						autoMappings.tieInNumber = header;
						mapped.add("tieInNumber");
					}
				}

				if (!autoMappings.comments) {
					if (
						headerLower === "comments" ||
						headerLower === "notes" ||
						headerLower === "remarks"
					) {
						autoMappings.comments = header;
						mapped.add("comments");
					}
				}
			});

			// Detect if this is a field weld import by checking actual data content
			let hasFieldWeldData = false;

			if (sampleData && sampleData.length > 0) {
				// Find the type column in the data
				const typeColumns = headers.filter(
					(header) =>
						header.toLowerCase().includes("type") ||
						header.toLowerCase().includes("component"),
				);

				// Check if any row has field weld type
				hasFieldWeldData = sampleData.some((row) => {
					return typeColumns.some((typeCol) => {
						const value =
							row[typeCol]?.toString().toLowerCase() || "";
						return (
							value.includes("field") && value.includes("weld")
						);
					});
				});

				console.log("Field weld detection:", {
					typeColumns,
					sampleData: sampleData.slice(0, 2),
					hasFieldWeldData,
				});
			}

			// Also check for weld-specific headers as a fallback
			const fieldWeldIndicators = [
				"weld size",
				"weldsize",
				"weld type",
				"weldtype",
				"schedule",
				"base metal",
				"basemetal",
				"x-ray",
				"xray",
				"pwht",
				"nde",
				"welder",
				"stencil",
				"tie-in",
				"tiein",
				"weld id",
				"weldid",
			];

			const hasWeldHeaders = headers.some((header) =>
				fieldWeldIndicators.some((indicator) =>
					header.toLowerCase().includes(indicator),
				),
			);

			setHasFieldWelds(hasFieldWeldData || hasWeldHeaders);

			setMappings(autoMappings);
			setAutoMapped(mapped);
		} catch (error: any) {
			setParseError(error.message || "Failed to parse file headers");
		} finally {
			setIsLoading(false);
		}
	};

	const handleMappingChange = (field: string, header: string) => {
		setMappings((prev) => {
			const updated = { ...prev };

			// Remove any existing mapping to this header
			Object.keys(updated).forEach((key) => {
				if (updated[key] === header && key !== field) {
					delete updated[key];
				}
			});

			if (header === "none") {
				delete updated[field];
			} else {
				updated[field] = header;
			}

			return updated;
		});
	};

	// Get relevant fields based on import type
	const getRelevantFields = () => {
		if (importType === "field_welds") {
			// For field welds, show both component and field weld specific fields
			return [...COMPONENT_FIELDS, ...FIELD_WELD_FIELDS];
		}
		// For components, show only component fields
		return COMPONENT_FIELDS;
	};

	const relevantFields = getRelevantFields();

	const validateMappings = (): boolean => {
		// Check that all required fields are mapped (Component ID, Component Type, Drawing ID)
		// Note: workflowType is auto-determined from Component Type, so not required for mapping
		const requiredFields = relevantFields.filter((f) => f.required);
		const basicValidation = requiredFields.every(
			(field) => mappings[field.value],
		);

		// If field welds are detected, weldId becomes required
		if (hasFieldWelds && !mappings.weldId) {
			return false;
		}

		return basicValidation;
	};

	const getValidationErrors = (): string[] => {
		const errors: string[] = [];
		const requiredFields = relevantFields.filter((f) => f.required);

		requiredFields.forEach((field) => {
			if (!mappings[field.value]) {
				if (field.value === "drawingId") {
					errors.push(
						"Drawing ID is required - all components must be associated with a drawing",
					);
				} else {
					errors.push(`${field.label} is required`);
				}
			}
		});

		// Add conditional validation for field welds
		if (hasFieldWelds && !mappings.weldId) {
			errors.push("Weld ID is required when importing field welds");
		}

		return errors;
	};

	const handleContinue = () => {
		if (validateMappings()) {
			onMappingComplete(mappings);
		}
	};

	const getMappedHeader = (field: string): string => {
		return mappings[field] || "none";
	};

	const isHeaderMapped = (header: string): boolean => {
		return Object.values(mappings).includes(header);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center space-y-4">
					<FileSpreadsheet className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
					<p className="text-muted-foreground">
						Parsing file headers...
					</p>
				</div>
			</div>
		);
	}

	if (parseError) {
		return (
			<Alert variant="error">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{parseError}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
				<div className="flex items-center gap-3">
					<FileSpreadsheet className="h-6 w-6 text-primary" />
					<div>
						<p className="font-medium">{file.name}</p>
						<p className="text-sm text-muted-foreground">
							{fileHeaders.length} columns detected
						</p>
					</div>
				</div>
				{autoMapped.size > 0 && (
					<Badge status="info" className="gap-1">
						<Sparkles className="h-3 w-3" />
						{autoMapped.size} auto-mapped
					</Badge>
				)}
			</div>

			<div className="space-y-4">
				<div className="grid gap-4">
					<div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Required Fields
					</div>
					{relevantFields
						.filter((f) => f.required)
						.map((field) => (
							<div
								key={field.value}
								className="grid grid-cols-2 gap-4 items-center"
							>
								<Label
									htmlFor={field.value}
									className="flex items-center gap-2"
								>
									<span className="text-red-500">*</span>
									{field.label}
									{field.value === "drawingId" && (
										<Badge
											status="error"
											className="text-xs"
										>
											Required
										</Badge>
									)}
									{autoMapped.has(field.value) && (
										<Badge
											status="info"
											className="text-xs gap-1"
										>
											<Sparkles className="h-2 w-2" />
											Auto
										</Badge>
									)}
									{field.description && (
										<span className="text-xs text-muted-foreground">
											({field.description})
										</span>
									)}
								</Label>
								<Select
									value={getMappedHeader(field.value)}
									onValueChange={(value) =>
										handleMappingChange(field.value, value)
									}
								>
									<SelectTrigger id={field.value}>
										<SelectValue placeholder="Select column" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											<span className="text-muted-foreground">
												-- Not mapped --
											</span>
										</SelectItem>
										{fileHeaders.map((header) => (
											<SelectItem
												key={header}
												value={header}
												disabled={false}
											>
												{header}
												{isHeaderMapped(header) &&
													getMappedHeader(
														field.value,
													) !== header && (
														<span className="text-muted-foreground ml-2">
															(mapped to other
															field)
														</span>
													)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						))}
				</div>

				<div className="grid gap-4">
					<div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Optional Fields
					</div>
					{relevantFields
						.filter((f) => !f.required)
						.map((field) => (
							<div
								key={field.value}
								className="grid grid-cols-2 gap-4 items-center"
							>
								<Label
									htmlFor={field.value}
									className="flex items-center gap-2"
								>
									{/* Show red asterisk for conditionally required fields */}
									{field.value === "weldId" &&
										hasFieldWelds && (
											<span className="text-red-500">
												*
											</span>
										)}
									{field.label}
									{field.value === "weldId" &&
										hasFieldWelds && (
											<Badge
												status="error"
												className="text-xs"
											>
												Required
											</Badge>
										)}
									{autoMapped.has(field.value) && (
										<Badge
											status="info"
											className="text-xs gap-1"
										>
											<Sparkles className="h-2 w-2" />
											Auto
										</Badge>
									)}
								</Label>
								<Select
									value={getMappedHeader(field.value)}
									onValueChange={(value) =>
										handleMappingChange(field.value, value)
									}
								>
									<SelectTrigger id={field.value}>
										<SelectValue placeholder="Select column" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											<span className="text-muted-foreground">
												-- Not mapped --
											</span>
										</SelectItem>
										{fileHeaders.map((header) => (
											<SelectItem
												key={header}
												value={header}
												disabled={false}
											>
												{header}
												{isHeaderMapped(header) &&
													getMappedHeader(
														field.value,
													) !== header && (
														<span className="text-muted-foreground ml-2">
															(mapped to other
															field)
														</span>
													)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						))}
				</div>

				{importType === "field_welds" && (
					<Alert className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Field Weld Import:</strong> QC-specific
							fields will create enhanced tracking records. If not
							mapped, default values will be used and can be
							updated later in the QC module.
						</AlertDescription>
					</Alert>
				)}
			</div>

			{!validateMappings() && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="space-y-1">
						<div>Please resolve the following mapping issues:</div>
						<ul className="list-disc list-inside space-y-1 mt-2">
							{getValidationErrors().map((error, index) => (
								<li key={index} className="text-sm">
									{error}
								</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			<div className="flex justify-between pt-6 border-t">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button onClick={handleContinue} disabled={!validateMappings()}>
					Continue to Validation
					<ArrowRight className="h-4 w-4 ml-2" />
				</Button>
			</div>
		</div>
	);
}
