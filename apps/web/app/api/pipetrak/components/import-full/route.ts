import { db as prisma } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { type NextRequest, NextResponse } from "next/server";
import {
	CSVProcessor,
	ExcelProcessor,
	type ComponentImportData,
	DataValidator,
	InstanceTracker,
} from "@repo/api/src/lib/file-processing";
import { MilestoneTemplateMapper } from "@repo/api/src/lib/milestone-template-mapper";

// Helper function to create milestones for newly created components
// Now handles components with different milestone templates
async function createComponentMilestones(
	tx: any, // Transaction context
	components: any[],
	templateMapper: MilestoneTemplateMapper,
) {
	// Fetch the created components to get their IDs and template assignments
	// Since createMany doesn't return IDs, we need to fetch them by their unique fields
	const componentLookupKeys = components.map((comp) => ({
		drawingId: comp.drawingId,
		componentId: comp.componentId,
		instanceNumber: comp.instanceNumber,
	}));

	const createdComponents = await tx.component.findMany({
		where: {
			OR: componentLookupKeys,
		},
		select: {
			id: true,
			componentId: true,
			drawingId: true,
			instanceNumber: true,
			workflowType: true,
			totalQuantity: true,
			milestoneTemplateId: true,
		},
	});

	console.log(
		`Import-full: Found ${createdComponents.length} created components for milestone creation`,
	);

	// Group components by their milestone template
	const componentsByTemplate = new Map<string, typeof createdComponents>();

	createdComponents.forEach((component: (typeof createdComponents)[0]) => {
		const templateId = component.milestoneTemplateId;
		if (!componentsByTemplate.has(templateId)) {
			componentsByTemplate.set(templateId, []);
		}
		componentsByTemplate.get(templateId)!.push(component);
	});

	console.log(
		`Import-full: Components grouped into ${componentsByTemplate.size} different milestone templates`,
	);

	// Prepare milestone data for batch insert
	const milestonesToCreate: any[] = [];
	let templateCount = 0;

	componentsByTemplate.forEach((templateComponents, templateId) => {
		templateCount++;
		const template = templateMapper.getTemplateById(templateId);

		if (
			!template ||
			!template.milestones ||
			template.milestones.length === 0
		) {
			console.warn(
				`Import-full: No milestone definitions found for template ID: ${templateId}`,
			);
			return;
		}

		console.log(
			`Import-full: Template ${templateCount}/${componentsByTemplate.size}: ${template.name} → ${templateComponents.length} components (${template.milestones.length} milestones each)`,
		);

		// Create milestones for all components using this template
		templateComponents.forEach((component: any) => {
			template.milestones.forEach((milestone: any, index: number) => {
				milestonesToCreate.push({
					componentId: component.id,
					milestoneName: milestone.name,
					milestoneOrder: milestone.order || index + 1,
					weight: milestone.weight || 1.0,
					isCompleted: false,
					// Set workflow-specific fields
					percentageValue:
						component.workflowType === "MILESTONE_PERCENTAGE"
							? 0
							: null,
					quantityValue:
						component.workflowType === "MILESTONE_QUANTITY"
							? 0
							: null,
				});
			});
		});
	});

	if (milestonesToCreate.length > 0) {
		console.log(
			`Import-full: Creating ${milestonesToCreate.length} milestone records across ${componentsByTemplate.size} different templates...`,
		);

		await tx.componentMilestone.createMany({
			data: milestonesToCreate,
		});

		console.log(
			`Import-full: ✅ Successfully created ${milestonesToCreate.length} milestones`,
		);
	} else {
		console.warn("Import-full: No milestones to create");
	}
}

export async function POST(request: NextRequest) {
	try {
		console.log("=== IMPORT-FULL ENDPOINT START ===");

		// Check authentication
		const session = await getSession();
		if (!session?.user?.id) {
			console.log("Import-full: Authentication failed");
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const userId = session.user.id;
		const body = await request.json();
		const { projectId, fileData, mappings, options = {} } = body;

		console.log("Import-full: Request params:", {
			projectId,
			hasFileData: !!fileData,
			mappingsCount: mappings?.length,
			options,
		});

		if (!projectId || !fileData || !mappings) {
			console.log("Import-full: Missing required parameters");
			return NextResponse.json(
				{
					error: "ProjectId, fileData, and mappings are required",
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
				"Import-full: Project not found or insufficient permissions",
			);
			return NextResponse.json(
				{
					error: "Project not found or insufficient permissions",
				},
				{ status: 403 },
			);
		}

		console.log("Import-full: Project access verified");

		// Parse the file completely
		const buffer = Buffer.from(fileData.buffer, "base64");

		let parseResult;
		if (fileData.mimetype === "text/csv") {
			const processor = new CSVProcessor();
			parseResult = await processor.parseCSV(buffer);
		} else {
			const processor = new ExcelProcessor();
			parseResult = await processor.parseExcel(buffer);
		}

		console.log(
			`Import-full: Parsed file with ${parseResult.rows.length} rows for component import`,
		);

		// Get existing drawings for validation - use drawing numbers, not IDs
		const existingDrawings = new Set(
			(
				await prisma.drawing.findMany({
					where: { projectId },
					select: { number: true },
				})
			).map((d) => d.number),
		);

		// Get existing milestone templates for validation
		const existingTemplates = new Set(
			(
				await prisma.milestoneTemplate.findMany({
					where: { projectId },
					select: { id: true },
				})
			).map((t) => t.id),
		);

		console.log("Import-full: Starting validation with:", {
			drawingNumbers: existingDrawings.size,
			milestoneTemplates: existingTemplates.size,
		});

		// Proper validation using DataValidator - pass raw rows, let validator do mapping
		const validator = new DataValidator();
		const validation = await validator.validateComponentData(
			parseResult.rows,
			mappings,
			{
				projectId,
				existingDrawings: existingDrawings,
				existingTemplates: existingTemplates,
			},
		);

		console.log("Import-full: Validation results:", {
			isValid: validation.isValid,
			validRows: validation.validRows.length,
			invalidRows: validation.invalidRows.length,
			errors: validation.errors.length,
			rollbackOnError: options.rollbackOnError,
		});

		if (!validation.isValid && options.rollbackOnError) {
			console.log(
				"Import-full: Early return due to validation failure with rollbackOnError",
			);
			return NextResponse.json({
				success: false,
				summary: {
					total: parseResult.rows.length,
					created: 0,
					updated: 0,
					skipped: 0,
					errors: validation.errors.length,
				},
				errors: validation.errors.map((err) => ({
					componentId: err.value || `Row ${err.row}`,
					error: err.error,
				})),
			});
		}

		const validComponents = validation.validRows;
		console.log(
			`Import-full: Validated ${validComponents.length} components out of ${parseResult.rows.length}`,
		);

		// Initialize milestone template mapper for type-specific assignment
		console.log("Import-full: Initializing milestone template mapper...");
		const templateMapper = new MilestoneTemplateMapper(projectId);
		await templateMapper.loadTemplates();

		const templateStats = templateMapper.getStats();
		console.log(
			`Import-full: Template mapper loaded ${templateStats.totalTemplates} templates:`,
			templateStats.templateNames,
		);

		// Ensure at least one template exists
		if (templateStats.totalTemplates === 0) {
			console.log(
				"Import-full: No milestone templates found, creating default template",
			);
			await templateMapper.ensureDefaultTemplate();
		}

		// Convert drawing numbers to drawing IDs for database operations
		const drawingNumberToIdMap = new Map<string, string>();

		// Get existing drawings and create missing ones
		const uniqueDrawingNumbers = new Set<string>();
		validComponents.forEach((comp) => {
			if (comp.drawingId) {
				uniqueDrawingNumbers.add(comp.drawingId as string);
			}
		});

		// Get existing drawings by number
		const existingDrawingsData = await prisma.drawing.findMany({
			where: {
				projectId,
				number: { in: Array.from(uniqueDrawingNumbers) },
			},
			select: { id: true, number: true },
		});

		// Build map from existing drawings
		existingDrawingsData.forEach((d) =>
			drawingNumberToIdMap.set(d.number, d.id),
		);

		// Create missing drawings
		const missingDrawings = Array.from(uniqueDrawingNumbers)
			.filter((num) => !drawingNumberToIdMap.has(num))
			.map((number) => ({
				projectId,
				number,
				title: `Auto-created drawing ${number}`,
			}));

		if (missingDrawings.length > 0) {
			const createdDrawings = await prisma.drawing.createManyAndReturn({
				data: missingDrawings,
			});
			createdDrawings.forEach((d) =>
				drawingNumberToIdMap.set(d.number, d.id),
			);
		}

		// Convert drawing numbers to IDs in components
		const componentsWithDrawingIds = validComponents.map((comp) => ({
			...comp,
			drawingId:
				drawingNumberToIdMap.get(comp.drawingId as string) ||
				comp.drawingId,
		}));

		console.log(
			"Import-full: Components with drawing IDs mapped:",
			componentsWithDrawingIds.length,
		);

		// Optimized batch processing - fetch all existing components once
		console.log(
			"Import-full: Pre-fetching all existing components for InstanceTracker...",
		);

		const existingComponents = await prisma.component.findMany({
			where: { projectId },
			select: {
				id: true,
				componentId: true,
				drawingId: true,
				instanceNumber: true,
				size: true,
				status: true,
				completionPercent: true,
			},
		});

		console.log(
			`Import-full: Found ${existingComponents.length} existing components`,
		);

		// Build InstanceTracker-compatible existing components map
		// Key format: "drawingId|componentId|size"
		const existingComponentsMap = new Map<
			string,
			Array<{
				componentId: string;
				instanceNumber: number;
				drawingId?: string;
				size?: string;
			}>
		>();
		const existingComponentLookup = new Map<
			string,
			(typeof existingComponents)[0]
		>();

		existingComponents.forEach((comp) => {
			// For InstanceTracker compatibility
			const trackerKey = `${comp.drawingId}|${comp.componentId}|${comp.size || ""}`;
			if (!existingComponentsMap.has(trackerKey)) {
				existingComponentsMap.set(trackerKey, []);
			}
			existingComponentsMap.get(trackerKey)!.push({
				componentId: comp.componentId,
				instanceNumber: comp.instanceNumber,
				drawingId: comp.drawingId,
				size: comp.size || undefined,
			});

			// For quick lookup during batch operations
			const lookupKey = `${comp.drawingId}:${comp.componentId}:${comp.instanceNumber}`;
			existingComponentLookup.set(lookupKey, comp);
		});

		console.log(
			`Import-full: Built InstanceTracker map with ${existingComponentsMap.size} component groups`,
		);

		// STEP 1: Consolidate duplicate entries before passing to InstanceTracker
		console.log(
			"Import-full: Consolidating duplicate component entries...",
		);
		const consolidationStartTime = Date.now();

		// Group components by drawingId + componentId + size for consolidation
		const componentGroups = new Map<string, any[]>();

		componentsWithDrawingIds.forEach((comp) => {
			const consolidationKey = `${comp.drawingId}|${comp.componentId}|${comp.size || ""}`;
			if (!componentGroups.has(consolidationKey)) {
				componentGroups.set(consolidationKey, []);
			}
			componentGroups.get(consolidationKey)!.push(comp);
		});

		// Consolidate duplicates by summing quantities
		const consolidatedComponents: any[] = [];
		let duplicateEntriesFound = 0;

		componentGroups.forEach((components, key) => {
			if (components.length === 1) {
				// No duplicates, use as-is
				consolidatedComponents.push(components[0]);
			} else {
				// Multiple entries - consolidate by summing quantities
				duplicateEntriesFound += components.length - 1;
				const baseComponent = { ...components[0] };

				// Sum all quantities
				let totalQuantity = 0;
				components.forEach((comp: ComponentImportData) => {
					const qty = Number(comp.totalQuantity) || 1;
					totalQuantity += qty;
				});

				baseComponent.totalQuantity = totalQuantity;
				consolidatedComponents.push(baseComponent);

				const [drawingId, componentId, size] = key.split("|");
				console.log(
					`Import-full: Consolidated ${components.length} entries for ${componentId}${size ? ` (size ${size})` : ""} on drawing ${drawingId}: total quantity ${totalQuantity}`,
				);
			}
		});

		const consolidationTime = Date.now() - consolidationStartTime;
		console.log(
			`Import-full: Consolidation completed in ${consolidationTime}ms - ${componentsWithDrawingIds.length} entries → ${consolidatedComponents.length} consolidated (${duplicateEntriesFound} duplicates merged)`,
		);

		// Use InstanceTracker to handle quantity expansion and instance calculation
		console.log(
			"Import-full: Using InstanceTracker to process consolidated components...",
		);
		const startTime = Date.now();

		// Call InstanceTracker to expand components based on quantity and assign instance numbers
		const expandedComponents =
			await InstanceTracker.calculateInstanceNumbers(
				consolidatedComponents as ComponentImportData[],
				existingComponentsMap,
			);

		console.log(
			`Import-full: InstanceTracker expanded ${consolidatedComponents.length} consolidated components to ${expandedComponents.length} instances`,
		);

		let createdCount = 0;
		let updatedCount = 0;
		let skipCount = 0;
		const finalErrors: any[] = [];

		// Define allowed fields for Component model (filter out invalid fields like 'comments')
		const allowedFields = [
			"componentId",
			"weldId",
			"type",
			"workflowType",
			"drawingId",
			"spec",
			"size",
			"material",
			"pressureRating",
			"description",
			"area",
			"system",
			"testPackage",
			"testPressure",
			"testRequired",
			"totalLength",
			"lengthUnit",
			"totalQuantity",
			"quantityUnit",
			"completionPercent",
			"status",
			"installationDate",
			"installerUserId",
		];

		// Process all expanded components and prepare for batch operations
		const componentsToCreate: any[] = [];
		const componentsToUpdate: { where: any; data: any }[] = [];

		// Track components in this batch to prevent duplicates
		const batchComponentKeys = new Set<string>();

		for (const comp of expandedComponents) {
			try {
				// InstanceTracker has already calculated: instanceNumber, totalInstancesOnDrawing, displayId
				const instanceNumber = (comp as any).instanceNumber;
				const totalInstancesOnDrawing = (comp as any)
					.totalInstancesOnDrawing;
				const displayId = (comp as any).displayId;

				// Check for duplicates within this batch first
				const batchKey = `${comp.drawingId}:${comp.componentId}:${instanceNumber}`;
				if (batchComponentKeys.has(batchKey)) {
					console.warn(
						`Import-full: Skipping duplicate component in batch: ${batchKey}`,
					);
					skipCount++;
					continue;
				}
				batchComponentKeys.add(batchKey);

				// Check if this exact component instance already exists in database
				const existingComponent = existingComponentLookup.get(batchKey);

				if (existingComponent && options.skipDuplicates) {
					console.log(
						`Import-full: Skipping existing component: ${batchKey}`,
					);
					skipCount++;
					continue;
				}

				// Debug logging for instance tracking (first few components only to avoid spam)
				if (createdCount + updatedCount < 10) {
					console.log(
						`InstanceTracker result for ${comp.componentId}:`,
						{
							drawingId: comp.drawingId?.slice(-8), // Last 8 chars of drawing ID
							instanceNumber,
							totalInstancesOnDrawing,
							displayId,
							quantityExpanded:
								!!comp.totalQuantity &&
								Number(comp.totalQuantity) > 1,
						},
					);
				}

				// Filter component data to only include valid fields
				const filteredCompData: Record<string, any> = {};
				for (const field of allowedFields) {
					if ((comp as any)[field] !== undefined) {
						filteredCompData[field] = (comp as any)[field];
					}
				}

				// Validate required fields
				if (!comp.drawingId || !comp.componentId || !instanceNumber) {
					const error = `Missing required fields: drawingId=${comp.drawingId}, componentId=${comp.componentId}, instanceNumber=${instanceNumber}`;
					console.error(`Import-full: ${error}`);
					finalErrors.push({
						componentId: comp.componentId || "UNKNOWN",
						error,
					});
					continue;
				}

				// Debug logging for component type analysis (first few components only to avoid spam)
				if (createdCount + updatedCount < 10) {
					console.log(
						`Import-full: Component debug - componentId: ${comp.componentId}, type: '${comp.type}', typeOf: ${typeof comp.type}`,
					);
				}

				// Determine appropriate milestone template based on component type
				const appropriateTemplate =
					templateMapper.getTemplateForComponentType(
						comp.type as string,
					);
				if (!appropriateTemplate) {
					// This should rarely happen now with improved fallback logic
					const error = `No milestone template found for component type: '${comp.type}' - this indicates a serious template configuration issue`;
					console.error(`Import-full: ${error}`);

					// Try to use the ensure default template as last resort
					const defaultTemplate =
						await templateMapper.ensureDefaultTemplate();
					if (defaultTemplate) {
						console.warn(
							`Import-full: Using emergency default template for ${comp.componentId}`,
						);
						// Continue with the default template instead of failing
					} else {
						finalErrors.push({
							componentId: comp.componentId || "UNKNOWN",
							error,
						});
						continue;
					}
				}

				// Validate that template has milestones before proceeding
				const finalTemplate =
					appropriateTemplate ||
					(await templateMapper.ensureDefaultTemplate());
				if (
					!finalTemplate ||
					!finalTemplate.milestones ||
					finalTemplate.milestones.length === 0
				) {
					const error = `Template ${finalTemplate?.name || "unknown"} has no milestone definitions`;
					console.error(`Import-full: ${error}`);
					finalErrors.push({
						componentId: comp.componentId || "UNKNOWN",
						error,
					});
					continue;
				}

				// Debug logging for template assignment (first few components only to avoid spam)
				if (createdCount + updatedCount < 20) {
					console.log(
						`Import-full: ✅ ${comp.componentId} (type: '${comp.type}') → ${finalTemplate.name} (${finalTemplate.milestones.length} milestones)`,
					);
				}

				const componentData = {
					...filteredCompData,
					projectId,
					milestoneTemplateId: finalTemplate.id,
					instanceNumber,
					totalInstancesOnDrawing,
					displayId,
					status:
						existingComponent?.status ||
						filteredCompData.status ||
						"NOT_STARTED",
					completionPercent:
						existingComponent?.completionPercent ||
						filteredCompData.completionPercent ||
						0,
				};

				if (existingComponent && options.updateExisting !== false) {
					// Prepare for batch update
					componentsToUpdate.push({
						where: { id: existingComponent.id },
						data: componentData,
					});
					updatedCount++;
				} else if (!existingComponent) {
					// Prepare for batch create
					componentsToCreate.push(componentData);
					createdCount++;
				} else {
					skipCount++;
				}
			} catch (error: any) {
				finalErrors.push({
					componentId: comp.componentId,
					error: error.message,
				});
			}
		}

		const processingTime = Date.now() - startTime;
		console.log(
			"Import-full: Component analysis completed in",
			processingTime,
			"ms",
		);
		console.log("Import-full: Executing batch operations...", {
			toCreate: componentsToCreate.length,
			toUpdate: componentsToUpdate.length,
			toSkip: skipCount,
			totalProcessed:
				componentsToCreate.length +
				componentsToUpdate.length +
				skipCount,
		});

		const dbStartTime = Date.now();

		// Execute batch operations in transaction
		await prisma.$transaction(async (tx) => {
			// Batch create new components
			if (componentsToCreate.length > 0) {
				console.log(
					`Import-full: Creating ${componentsToCreate.length} new components...`,
				);
				const createStartTime = Date.now();

				try {
					await tx.component.createMany({
						data: componentsToCreate,
					});
					const createTime = Date.now() - createStartTime;
					console.log(
						`Import-full: ✅ Created ${componentsToCreate.length} components in ${createTime}ms`,
					);

					// Create milestones for all newly created components
					if (componentsToCreate.length > 0) {
						const milestoneStartTime = Date.now();
						console.log(
							`Import-full: Creating milestones for ${componentsToCreate.length} components...`,
						);

						await createComponentMilestones(
							tx,
							componentsToCreate,
							templateMapper,
						);

						const milestoneTime = Date.now() - milestoneStartTime;
						console.log(
							`Import-full: ✅ Created milestones for ${componentsToCreate.length} components in ${milestoneTime}ms`,
						);
					}
				} catch (error: any) {
					console.error(
						"Import-full: ❌ Failed to create components:",
						error.message,
					);

					// Log details about the first few components that would be created
					console.error(
						"Import-full: First 5 components in batch:",
						componentsToCreate.slice(0, 5).map((comp) => ({
							drawingId: comp.drawingId,
							componentId: comp.componentId,
							instanceNumber: comp.instanceNumber,
							displayId: comp.displayId,
						})),
					);

					// Check for potential unique constraint violations
					const potentialDuplicates = new Set<string>();
					const duplicateComponents: any[] = [];

					componentsToCreate.forEach((comp, index) => {
						const key = `${comp.drawingId}:${comp.componentId}:${comp.instanceNumber}`;
						if (potentialDuplicates.has(key)) {
							duplicateComponents.push({ index, ...comp });
						} else {
							potentialDuplicates.add(key);
						}
					});

					if (duplicateComponents.length > 0) {
						console.error(
							`Import-full: Found ${duplicateComponents.length} potential duplicates in batch:`,
							duplicateComponents.map((comp) => ({
								index: comp.index,
								drawingId: comp.drawingId,
								componentId: comp.componentId,
								instanceNumber: comp.instanceNumber,
							})),
						);
					}

					throw error; // Re-throw to abort transaction
				}
			}

			// Batch update existing components (in chunks to avoid query size limits)
			if (componentsToUpdate.length > 0) {
				console.log(
					`Import-full: Updating ${componentsToUpdate.length} existing components...`,
				);
				const updateStartTime = Date.now();
				const updateChunkSize = 100;

				for (
					let i = 0;
					i < componentsToUpdate.length;
					i += updateChunkSize
				) {
					const chunk = componentsToUpdate.slice(
						i,
						i + updateChunkSize,
					);
					await Promise.all(
						chunk.map((update) => tx.component.update(update)),
					);

					// Log progress for large updates
					if (componentsToUpdate.length > updateChunkSize) {
						const processed = Math.min(
							i + updateChunkSize,
							componentsToUpdate.length,
						);
						const chunkTime = Date.now() - updateStartTime;
						console.log(
							`Import-full: Updated ${processed}/${componentsToUpdate.length} components (${chunkTime}ms)...`,
						);
					}
				}

				const updateTime = Date.now() - updateStartTime;
				console.log(
					`Import-full: ✅ Updated ${componentsToUpdate.length} components in ${updateTime}ms`,
				);
			}
		});

		const dbTime = Date.now() - dbStartTime;
		const totalTime = Date.now() - startTime;
		console.log("Import-full: ✅ Batch operations completed successfully");
		console.log("Import-full: Performance Summary:", {
			totalProcessingTime: totalTime + "ms",
			databaseTime: dbTime + "ms",
			analysisTime: processingTime + "ms",
			componentsPerSecond: Math.round(
				(componentsToCreate.length + componentsToUpdate.length) /
					(totalTime / 1000),
			),
		});

		const success =
			finalErrors.length === 0 ||
			(finalErrors.length > 0 && !options.rollbackOnError);

		console.log("Import-full: Processing completed:", {
			success,
			created: createdCount,
			updated: updatedCount,
			skipped: skipCount,
			errors: finalErrors.length,
		});

		const response = {
			success,
			summary: {
				total: expandedComponents.length, // Total instances created after quantity expansion
				originalComponents: validComponents.length, // Original rows from Excel
				consolidatedComponents: consolidatedComponents.length, // After merging duplicates
				duplicatesConsolidated: duplicateEntriesFound, // Number of duplicate entries merged
				created: createdCount,
				updated: updatedCount,
				skipped: skipCount,
				errors: finalErrors.length,
			},
			errors: finalErrors.length > 0 ? finalErrors : undefined,
		};

		console.log("Import-full: Returning response:", response);
		console.log("=== IMPORT-FULL ENDPOINT END ===");

		return NextResponse.json(response);
	} catch (error: any) {
		console.error("Component import error:", error);
		return NextResponse.json(
			{
				error: `Failed to import components: ${error.message}`,
			},
			{ status: 500 },
		);
	}
}
