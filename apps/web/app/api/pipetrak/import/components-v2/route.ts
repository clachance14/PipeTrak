import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@saas/auth/lib/server";
import { db as prisma } from "@repo/database";
import { ComponentTypeMapper } from "@repo/api/src/lib/import/type-mapper";
import { MilestoneTemplateAssigner } from "@repo/api/src/lib/import/template-assigner";
import {
	parseExcel,
	calculateTotalInstances,
	detectColumnMapping,
} from "@repo/api/src/lib/import/excel-parser";
import type {
	ComponentImportData,
	ComponentInstanceData,
	ImportPreviewResult,
	ImportResult,
} from "@repo/api";

type ComponentType =
	| "PIPE"
	| "SPOOL"
	| "VALVE"
	| "FITTING"
	| "FLANGE"
	| "GASKET"
	| "SUPPORT"
	| "INSTRUMENT"
	| "FIELD_WELD"
	| "MISC";

export async function POST(request: NextRequest) {
	try {
		console.log("=== IMPORT COMPONENTS V2 START ===");

		// Check authentication
		const session = await getSession();
		if (!session?.user?.id) {
			console.log("Import V2: Authentication failed");
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const userId = session.user.id;
		const body = await request.json();
		const { projectId, fileData, preview = false } = body;

		console.log("Import V2: Request params:", {
			projectId,
			hasFileData: !!fileData,
			preview,
		});

		if (!projectId || !fileData) {
			console.log("Import V2: Missing required parameters");
			return NextResponse.json(
				{
					error: "ProjectId and fileData are required",
				},
				{ status: 400 },
			);
		}

		// Verify user has admin access to the project
		const project = await prisma.project.findFirst({
			where: {
				id: projectId,
				organization: {
					members: {
						some: {
							userId,
							role: { in: ["owner", "admin"] },
						},
					},
				},
			},
		});

		if (!project) {
			console.log(
				"Import V2: Project not found or insufficient permissions",
			);
			return NextResponse.json(
				{
					error: "Project not found or insufficient permissions",
				},
				{ status: 403 },
			);
		}

		console.log("Import V2: Project access verified");

		// Parse the Excel file
		const buffer = Buffer.from(fileData.buffer, "base64");
		const parseResult = await parseExcel(buffer);

		console.log(
			`Import V2: Parsed Excel file with ${parseResult.rows.length} rows`,
		);
		console.log("Import V2: Headers:", parseResult.headers);

		// Initialize type mapper
		const typeMapper = new ComponentTypeMapper();

		// Extract types from the data
		const columnMapping = detectColumnMapping(parseResult.headers);
		const typeColumn = columnMapping.type || "TYPE";
		const types = parseResult.rows
			.map((row) => row[typeColumn])
			.filter((type) => type && type.trim() !== "");

		console.log(
			`Import V2: Found ${types.length} component types to analyze`,
		);

		// If preview mode, return mapping statistics
		if (preview) {
			const typeCounts = typeMapper.getTypeCounts(types);
			const mappingStats = typeMapper.getMappingStats(types);
			const estimatedInstances = calculateTotalInstances(
				parseResult.rows,
			);

			console.log("Import V2: Preview results:", {
				totalRows: parseResult.rows.length,
				typeCounts,
				unknownTypes: mappingStats.unknown,
				estimatedInstances,
			});

			const previewResult: ImportPreviewResult = {
				preview: true,
				totalRows: parseResult.rows.length,
				typeMappings: typeCounts,
				unknownTypes: mappingStats.unknown,
				estimatedInstances,
			};

			return NextResponse.json(previewResult);
		}

		// Full import process
		console.log("Import V2: Starting full import process...");

		// Initialize template assigner
		const templateAssigner = new MilestoneTemplateAssigner();
		await templateAssigner.initialize(projectId);

		// Process each row into component data
		const componentDataList: ComponentImportData[] = [];
		const errors: string[] = [];

		for (let i = 0; i < parseResult.rows.length; i++) {
			const row = parseResult.rows[i];
			const rowNumber = i + 2; // Excel row number (header is row 1)

			try {
				const drawingId = row[columnMapping.drawing || "DRAWING"];
				const componentId =
					row[columnMapping.componentId || "CMDTY CODE"];
				const type = row[columnMapping.type || "TYPE"];

				// Validate required fields
				if (!drawingId || !componentId) {
					errors.push(
						`Row ${rowNumber}: Missing required fields (Drawing: ${drawingId}, Component ID: ${componentId})`,
					);
					continue;
				}

				const componentData: ComponentImportData = {
					projectId,
					drawingId: String(drawingId).trim(),
					componentId: String(componentId).trim(),
					type: typeMapper.mapType(type),
					spec: row[columnMapping.spec || "SPEC"]
						? String(row[columnMapping.spec || "SPEC"]).trim()
						: undefined,
					size: row[columnMapping.size || "SIZE"]
						? String(row[columnMapping.size || "SIZE"]).trim()
						: undefined,
					description: row[columnMapping.description || "DESCRIPTION"]
						? String(
								row[columnMapping.description || "DESCRIPTION"],
							).trim()
						: undefined,
					material: row[columnMapping.material || "MATERIAL"]
						? String(
								row[columnMapping.material || "MATERIAL"],
							).trim()
						: undefined,
					area: row[columnMapping.area || "Area"]
						? String(row[columnMapping.area || "Area"]).trim()
						: undefined,
					system: row[columnMapping.system || "System"]
						? String(row[columnMapping.system || "System"]).trim()
						: undefined,
					testPackage: row[
						columnMapping.testPackage || "Test Package"
					]
						? String(
								row[
									columnMapping.testPackage || "Test Package"
								],
							).trim()
						: undefined,
					notes: row[columnMapping.comments || "Comments"]
						? String(
								row[columnMapping.comments || "Comments"],
							).trim()
						: undefined,
					quantity:
						Number.parseInt(
							String(row[columnMapping.quantity || "QTY"]),
						) || 1,
				};

				componentDataList.push(componentData);
			} catch (error) {
				errors.push(`Row ${rowNumber}: ${(error as Error).message}`);
			}
		}

		console.log(
			`Import V2: Processed ${componentDataList.length} valid components, ${errors.length} errors`,
		);

		// Check for potential duplicate rows in Excel data
		const excelDuplicateMap = new Map<string, number>();
		componentDataList.forEach((comp) => {
			const key = `${comp.drawingId}:${comp.componentId}`;
			excelDuplicateMap.set(
				key,
				(excelDuplicateMap.get(key) || 0) + comp.quantity,
			);
		});

		const duplicateComponents = Array.from(
			excelDuplicateMap.entries(),
		).filter(([key, totalQty]) => {
			return (
				componentDataList.filter(
					(comp) => `${comp.drawingId}:${comp.componentId}` === key,
				).length > 1
			);
		});

		if (duplicateComponents.length > 0) {
			console.log(
				`Import V2: Found ${duplicateComponents.length} component/drawing combinations with multiple Excel rows:`,
			);
			duplicateComponents.slice(0, 5).forEach(([key, totalQty]) => {
				const [drawingId, componentId] = key.split(":");
				console.log(
					`  - ${componentId} on ${drawingId} (total qty: ${totalQty})`,
				);
			});
		}

		// Group components by (drawing, componentId) and sum quantities
		console.log(
			"Import V2: Grouping components by drawing+componentId to prevent duplicates...",
		);
		const componentGroups = new Map<string, ComponentImportData>();

		for (const comp of componentDataList) {
			const key = `${comp.drawingId}:${comp.componentId}`;

			if (componentGroups.has(key)) {
				// Sum the quantities for duplicate entries
				const existing = componentGroups.get(key)!;
				existing.quantity += comp.quantity;
				console.log(
					`Import V2: Merged duplicate ${comp.componentId} on ${comp.drawingId}, total qty now: ${existing.quantity}`,
				);
			} else {
				// First occurrence - add to groups
				componentGroups.set(key, { ...comp });
			}
		}

		const groupedComponentList = Array.from(componentGroups.values());
		console.log(
			`Import V2: Grouped ${componentDataList.length} rows into ${groupedComponentList.length} unique components`,
		);

		if (groupedComponentList.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "No valid components to import",
					errors,
				},
				{ status: 400 },
			);
		}

		// Ensure drawings exist first
		const uniqueDrawings = Array.from(
			new Set(groupedComponentList.map((c) => c.drawingId)),
		);
		await ensureDrawingsExist(projectId, uniqueDrawings);

		// Get drawing ID mappings
		const drawings = await prisma.drawing.findMany({
			where: { projectId, number: { in: uniqueDrawings } },
			select: { id: true, number: true },
		});

		const drawingIdMap = new Map(drawings.map((d) => [d.number, d.id]));

		// Get existing components to avoid duplicates and calculate proper instance numbering
		const drawingIds = Array.from(drawingIdMap.values());
		const componentIds = Array.from(
			new Set(groupedComponentList.map((c) => c.componentId)),
		);

		const existingComponents = await prisma.component.findMany({
			where: {
				projectId,
				drawingId: { in: drawingIds },
				componentId: { in: componentIds },
			},
			select: {
				drawingId: true,
				componentId: true,
				instanceNumber: true,
			},
		});

		// Build map of existing instances: "drawingId:componentId" -> max instance number
		const existingInstanceMap = new Map<string, number>();
		for (const comp of existingComponents) {
			const key = `${comp.drawingId}:${comp.componentId}`;
			const currentMax = existingInstanceMap.get(key) || 0;
			existingInstanceMap.set(
				key,
				Math.max(currentMax, comp.instanceNumber),
			);
		}

		console.log(
			`Import V2: Found ${existingComponents.length} existing component instances`,
		);
		if (existingComponents.length > 0) {
			console.log(
				"Import V2: Sample existing components:",
				existingComponents
					.slice(0, 3)
					.map((c) => ({
						drawingId: c.drawingId,
						componentId: c.componentId,
						instanceNumber: c.instanceNumber,
					})),
			);
		}

		// Expand quantities to individual instances, accounting for existing instances
		const componentInstances: ComponentInstanceData[] = [];
		const componentsToCreate: ComponentInstanceData[] = [];
		let skippedDuplicates = 0;

		for (const compData of groupedComponentList) {
			const quantity = compData.quantity;
			const drawingId = drawingIdMap.get(compData.drawingId)!;
			const existingKey = `${drawingId}:${compData.componentId}`;
			const existingMaxInstance =
				existingInstanceMap.get(existingKey) || 0;

			// Check if this exact component already exists with the same quantity
			const existingCount = existingComponents.filter(
				(c) =>
					c.drawingId === drawingId &&
					c.componentId === compData.componentId,
			).length;

			// Debug logging for first few components
			if (componentInstances.length < 3) {
				console.log(
					`Import V2: Processing ${compData.componentId} on drawing ${compData.drawingId} (UUID: ${drawingId})`,
				);
				console.log(
					`Import V2: Existing count: ${existingCount}, quantity: ${quantity}, max instance: ${existingMaxInstance}`,
				);
				console.log(
					`Import V2: Will create ${quantity - existingCount} instances starting from ${existingMaxInstance + 1}`,
				);
			}

			// If we already have this exact quantity, skip it
			if (existingCount >= quantity) {
				console.log(
					`Import V2: Skipping ${compData.componentId} on ${compData.drawingId} - already exists`,
				);
				skippedDuplicates += quantity;
				continue;
			}

			// Create instances starting after existing ones
			const startInstance = existingMaxInstance + 1;
			const instancesToCreate = quantity - existingCount;

			for (let i = 0; i < instancesToCreate; i++) {
				const instanceNumber = startInstance + i;
				const totalOnDrawing = existingCount + instancesToCreate;

				const instance: ComponentInstanceData = {
					projectId: compData.projectId,
					drawingId: drawingId, // Use the UUID, not the drawing number
					componentId: compData.componentId,
					type: compData.type,
					spec: compData.spec,
					size: compData.size,
					description: compData.description,
					material: compData.material,
					area: compData.area,
					system: compData.system,
					testPackage: compData.testPackage,
					notes: compData.notes,
					instanceNumber,
					totalInstancesOnDrawing: totalOnDrawing,
					displayId:
						totalOnDrawing > 1
							? `${compData.componentId} (${instanceNumber} of ${totalOnDrawing})`
							: compData.componentId,
					milestoneTemplateId: templateAssigner.getTemplateForType(
						compData.type as ComponentType,
					),
					workflowType: "MILESTONE_DISCRETE",
					status: "NOT_STARTED",
					completionPercent: 0,
				};

				componentInstances.push(instance);

				// Prepare for database insertion
				componentsToCreate.push({
					projectId: instance.projectId,
					drawingId: drawingId,
					componentId: instance.componentId,
					type: instance.type,
					spec: instance.spec,
					size: instance.size,
					description: instance.description,
					material: instance.material,
					area: instance.area,
					system: instance.system,
					testPackage: instance.testPackage,
					notes: instance.notes,
					instanceNumber: instance.instanceNumber,
					totalInstancesOnDrawing: instance.totalInstancesOnDrawing,
					displayId: instance.displayId,
					milestoneTemplateId: instance.milestoneTemplateId,
					workflowType: instance.workflowType,
					status: instance.status,
					completionPercent: instance.completionPercent,
				});
			}
		}

		console.log(
			`Import V2: Expanded to ${componentInstances.length} new component instances`,
		);
		console.log(
			`Import V2: Skipped ${skippedDuplicates} duplicate instances`,
		);

		// Check for duplicates within the batch before database insertion
		const duplicateChecker = new Map<string, any>();
		const actualDuplicates = [];

		for (const comp of componentsToCreate) {
			const key = `${comp.drawingId}:${comp.componentId}:${comp.instanceNumber}`;
			if (duplicateChecker.has(key)) {
				const existing = duplicateChecker.get(key);
				actualDuplicates.push({
					key,
					existing: {
						drawingId: existing.drawingId,
						componentId: existing.componentId,
						instanceNumber: existing.instanceNumber,
					},
					duplicate: {
						drawingId: comp.drawingId,
						componentId: comp.componentId,
						instanceNumber: comp.instanceNumber,
					},
				});
			}
			duplicateChecker.set(key, comp);
		}

		if (actualDuplicates.length > 0) {
			console.error(
				`Import V2: FOUND ${actualDuplicates.length} DUPLICATE ENTRIES IN BATCH:`,
			);
			actualDuplicates.forEach((dup) => {
				console.error(`  - Duplicate: ${dup.key}`);
			});
		}

		// Log first few components being created for debugging
		console.log("Import V2: Sample components to create (first 5):");
		componentsToCreate.slice(0, 5).forEach((comp, idx) => {
			console.log(
				`  ${idx + 1}. Drawing: ${comp.drawingId}, Component: ${comp.componentId}, Instance: ${comp.instanceNumber}`,
			);
		});

		// Execute in batches to avoid transaction timeouts
		const result = { count: 0, skipped: skippedDuplicates };
		const BATCH_SIZE = 200; // Process 200 components at a time

		if (componentsToCreate.length > 0) {
			console.log(
				`Import V2: Processing ${componentsToCreate.length} components in batches of ${BATCH_SIZE}...`,
			);

			// Split components into batches
			const batches = [];
			for (let i = 0; i < componentsToCreate.length; i += BATCH_SIZE) {
				batches.push(componentsToCreate.slice(i, i + BATCH_SIZE));
			}

			console.log(`Import V2: Created ${batches.length} batches`);

			let totalCreated = 0;

			// Process each batch in its own transaction
			for (
				let batchIndex = 0;
				batchIndex < batches.length;
				batchIndex++
			) {
				const batch = batches[batchIndex];
				const batchNumber = batchIndex + 1;

				console.log(
					`Import V2: Processing batch ${batchNumber}/${batches.length} (${batch.length} components)...`,
				);

				const batchResult = await prisma.$transaction(
					async (tx) => {
						// Create components for this batch
						const createdComponents =
							await tx.component.createManyAndReturn({
								data: batch as any,
							});

						// Create milestones for this batch
						if (createdComponents.length > 0) {
							await templateAssigner.createMilestonesForComponents(
								createdComponents.map((c) => ({
									id: c.id,
									milestoneTemplateId: c.milestoneTemplateId,
									workflowType: c.workflowType,
								})),
								tx, // Pass the transaction client
							);
						}

						return { count: createdComponents.length };
					},
					{
						timeout: 30000, // 30 seconds (increased from 5 seconds default)
						maxWait: 30000, // 30 seconds max queue wait
					},
				);

				totalCreated += batchResult.count;
				console.log(
					`Import V2: Batch ${batchNumber} completed - created ${batchResult.count} components (${totalCreated}/${componentsToCreate.length} total)`,
				);
			}

			result.count = totalCreated;
			console.log(
				`Import V2: All batches completed - total created: ${totalCreated} components`,
			);
		} else {
			console.log(
				"Import V2: No new components to create - all were duplicates",
			);
		}

		console.log("Import V2: ✅ Import completed successfully");

		const importResult: ImportResult = {
			success: true,
			imported: result.count,
			summary: {
				rows: parseResult.rows.length,
				groupedComponents: groupedComponentList.length,
				instances: result.count,
				skipped: result.skipped,
				mappings: typeMapper.getMappingStats(types),
			},
		};

		return NextResponse.json(importResult);
	} catch (error: any) {
		console.error("Import V2 error:", error);

		let errorMessage = error.message;
		let status = 500;

		// Handle specific Prisma errors
		if (error.code === "P2002") {
			errorMessage =
				"Duplicate components detected. This usually means the same components are already imported. Please check your data or contact support.";
			status = 409; // Conflict
		} else if (error.code === "P2003") {
			errorMessage =
				"Foreign key constraint violation. Please ensure all referenced data exists.";
			status = 400; // Bad Request
		} else if (error.code === "P2025") {
			errorMessage =
				"Required record not found. Please check your project and drawing data.";
			status = 404; // Not Found
		}

		return NextResponse.json(
			{
				error: `Failed to import components: ${errorMessage}`,
				code: error.code || "UNKNOWN",
			},
			{ status },
		);
	}
}

// Helper function to ensure drawings exist
async function ensureDrawingsExist(
	projectId: string,
	drawingNumbers: string[],
) {
	console.log(
		`Import V2: Ensuring ${drawingNumbers.length} drawings exist...`,
	);

	const existing = await prisma.drawing.findMany({
		where: { projectId, number: { in: drawingNumbers } },
		select: { number: true },
	});

	const existingNumbers = new Set(existing.map((d) => d.number));
	const missing = drawingNumbers.filter((n) => !existingNumbers.has(n));

	if (missing.length > 0) {
		console.log(
			`Import V2: Creating ${missing.length} missing drawings...`,
		);
		await prisma.drawing.createMany({
			data: missing.map((number) => ({
				projectId,
				number,
				title: `Drawing ${number}`,
			})),
		});
		console.log(`Import V2: ✅ Created ${missing.length} drawings`);
	} else {
		console.log("Import V2: All drawings already exist");
	}
}
