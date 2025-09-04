#!/usr/bin/env tsx

import { db as prisma } from '../../../packages/database';
import { MilestoneTemplateMapper } from '../../../packages/api/src/lib/milestone-template-mapper';
import { CSVProcessor, DataValidator, InstanceTracker } from '../../../packages/api/src/lib/file-processing';
import * as fs from 'fs';
import * as path from 'path';

async function testImportLogicDirect() {
  try {
    console.log('🧪 Testing Import Logic Directly (Without API)...\n');

    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true, organizationId: true }
    });

    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }

    console.log(`Using project: ${project.jobName} (${project.id})\n`);

    // Clean up any existing test components first
    console.log('🧹 Cleaning up existing test components...');
    const deletedComponents = await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'TEST_' }
      }
    });
    console.log(`Deleted ${deletedComponents.count} existing test components\n`);

    // Read and parse the test CSV file
    const csvPath = path.join(process.cwd(), '../../test-template-assignment.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`Test CSV file not found at: ${csvPath}`);
      return;
    }

    const csvBuffer = fs.readFileSync(csvPath);
    console.log('📄 Parsing CSV file...');
    
    const processor = new CSVProcessor();
    const parseResult = await processor.parseCSV(csvBuffer);
    console.log(`Parsed ${parseResult.rows.length} rows\n`);

    // Define column mappings - using correct property names
    const mappings = [
      { sourceColumn: 'componentId', targetField: 'componentId' },
      { sourceColumn: 'type', targetField: 'type' },
      { sourceColumn: 'workflowType', targetField: 'workflowType' },
      { sourceColumn: 'drawingId', targetField: 'drawingId' },
      { sourceColumn: 'spec', targetField: 'spec' },
      { sourceColumn: 'size', targetField: 'size' },
      { sourceColumn: 'material', targetField: 'material' },
      { sourceColumn: 'area', targetField: 'area' },
      { sourceColumn: 'system', targetField: 'system' },
      { sourceColumn: 'description', targetField: 'description' },
      { sourceColumn: 'totalQuantity', targetField: 'totalQuantity', transform: (val: any) => Number(val) || 1 }
    ];

    // Validate the data
    console.log('🔍 Validating component data...');
    const validator = new DataValidator();
    const validation = await validator.validateComponentData(
      parseResult.rows,
      mappings,
      {
        projectId: project.id,
        existingDrawings: new Set(),
        existingTemplates: new Set(),
      }
    );

    console.log(`Validation results: ${validation.validRows.length} valid, ${validation.invalidRows.length} invalid\n`);

    if (!validation.isValid) {
      console.error('❌ Validation failed:');
      validation.errors.forEach((error: any) => {
        console.error(`  - Row ${error.row}: ${error.error}`);
      });
      return;
    }

    // Initialize milestone template mapper
    console.log('🎯 Initializing milestone template mapper...');
    const templateMapper = new MilestoneTemplateMapper(project.id);
    await templateMapper.loadTemplates();
    
    const stats = templateMapper.getStats();
    console.log(`Loaded ${stats.totalTemplates} templates: ${stats.templateNames.join(', ')}\n`);

    // Create missing drawings
    console.log('📋 Creating test drawing...');
    const testDrawing = await prisma.drawing.create({
      data: {
        projectId: project.id,
        number: 'TEST_DWG_001',
        title: 'Test Drawing for Template Assignment'
      }
    });
    console.log(`Created drawing: ${testDrawing.number}\n`);

    // Process components and test template assignment
    console.log('🔄 Processing components with template assignment...');
    const validComponents = validation.validRows;
    
    // Update drawing IDs to use the created drawing
    const componentsWithDrawingIds = validComponents.map((comp: any) => ({
      ...comp,
      drawingId: testDrawing.id
    }));

    // Use InstanceTracker to handle expansion
    const expandedComponents = await InstanceTracker.calculateInstanceNumbers(
      componentsWithDrawingIds as any[],
      new Map()
    );

    console.log(`Expanded ${componentsWithDrawingIds.length} components to ${expandedComponents.length} instances\n`);

    // Process each component and test template assignment
    const testResults: any[] = [];
    const componentsToCreate: any[] = [];

    for (const comp of expandedComponents) {
      console.log(`\n🧪 Testing component: ${comp.componentId} (type: ${comp.type})`);
      
      // Test template assignment
      const template = templateMapper.getTemplateForComponentType(comp.type as string);
      
      if (!template) {
        console.error(`❌ No template found for type: ${comp.type}`);
        continue;
      }

      console.log(`✅ Template assigned: ${template.name} (${template.milestones.length} milestones)`);
      
      // Track result
      testResults.push({
        componentId: comp.componentId,
        type: comp.type,
        templateName: template.name,
        milestonesCount: template.milestones.length,
        success: true
      });

      // Prepare for creation
      const componentData = {
        projectId: project.id,
        componentId: comp.componentId,
        type: comp.type,
        workflowType: comp.workflowType,
        drawingId: comp.drawingId,
        milestoneTemplateId: template.id,
        spec: comp.spec,
        size: comp.size,
        material: comp.material,
        area: comp.area,
        system: comp.system,
        description: comp.description,
        totalQuantity: Number(comp.totalQuantity) || 1,
        instanceNumber: (comp as any).instanceNumber || 1,
        totalInstancesOnDrawing: (comp as any).totalInstancesOnDrawing || 1,
        displayId: (comp as any).displayId || comp.componentId,
        status: 'NOT_STARTED',
        completionPercent: 0
      };

      componentsToCreate.push(componentData);
    }

    // Create components in database
    console.log(`\n📝 Creating ${componentsToCreate.length} components in database...`);
    await prisma.component.createMany({
      data: componentsToCreate
    });

    // Fetch created components to get IDs
    const createdComponents = await prisma.component.findMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'TEST_' }
      },
      select: {
        id: true,
        componentId: true,
        milestoneTemplateId: true,
        workflowType: true
      }
    });

    console.log(`Created ${createdComponents.length} components\n`);

    // Create milestones for each component
    console.log('🎯 Creating milestones for components...');
    const milestonesToCreate: any[] = [];

    for (const component of createdComponents) {
      const template = templateMapper.getTemplateById(component.milestoneTemplateId);
      if (!template || !template.milestones) {
        console.warn(`No milestones found for template ID: ${component.milestoneTemplateId}`);
        continue;
      }

      template.milestones.forEach((milestone: any, index: number) => {
        milestonesToCreate.push({
          componentId: component.id,
          milestoneName: milestone.name,
          milestoneOrder: milestone.order || index + 1,
          weight: milestone.weight || 1.0,
          isCompleted: false,
          percentageValue: component.workflowType === 'MILESTONE_PERCENTAGE' ? 0 : null,
          quantityValue: component.workflowType === 'MILESTONE_QUANTITY' ? 0 : null,
        });
      });
    }

    if (milestonesToCreate.length > 0) {
      await prisma.componentMilestone.createMany({
        data: milestonesToCreate
      });
      console.log(`Created ${milestonesToCreate.length} milestones\n`);
    }

    // Verify the results
    console.log('🔍 Verifying final results...');
    const finalComponents = await prisma.component.findMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'TEST_' }
      },
      include: {
        milestoneTemplate: {
          select: { name: true, milestones: true }
        },
        milestones: {
          select: { milestoneName: true }
        }
      },
      orderBy: { componentId: 'asc' }
    });

    console.log('📊 Final Template Assignment Results:');
    console.log('─'.repeat(80));

    const expectedMappings: Record<string, string> = {
      'TEST_VALVE_001': 'Reduced Milestone Set',
      'TEST_GASKET_001': 'Reduced Milestone Set', 
      'TEST_SPOOL_001': 'Full Milestone Set',
      'TEST_FITTING_001': 'Reduced Milestone Set',
      'TEST_SUPPORT_001': 'Reduced Milestone Set',
      'TEST_FIELD_WELD_001': 'Field Weld',
      'TEST_INSULATION_001': 'Insulation',
      'TEST_PAINT_001': 'Paint'
    };

    let correctAssignments = 0;
    let totalComponents = 0;

    finalComponents.forEach((comp: any) => {
      const expected = expectedMappings[comp.componentId];
      const actual = comp.milestoneTemplate?.name;
      const isCorrect = expected === actual;
      
      const status = isCorrect ? '✅' : '❌';
      const milestones = Array.isArray(comp.milestoneTemplate?.milestones) ? comp.milestoneTemplate.milestones : [];
      
      console.log(`${status} ${comp.componentId.padEnd(22)} (${comp.type?.padEnd(10) || 'N/A'.padEnd(10)})`);
      console.log(`     Expected: ${expected?.padEnd(22) || 'Unknown'}`);
      console.log(`     Actual:   ${actual?.padEnd(22) || 'None'} (${milestones.length} milestones defined, ${comp.milestones.length} created)`);
      
      if (isCorrect) {
        correctAssignments++;
      }
      totalComponents++;
      console.log('');
    });

    console.log('─'.repeat(80));
    const accuracy = (correctAssignments / totalComponents) * 100;
    console.log(`📈 Template Assignment Accuracy: ${correctAssignments}/${totalComponents} (${accuracy.toFixed(1)}%)`);
    
    if (correctAssignments === totalComponents) {
      console.log('🎉 SUCCESS: All template assignments are correct!');
      console.log('✅ The milestone template assignment bug has been fixed!');
    } else {
      console.log('⚠️  Some template assignments are still incorrect');
      console.log('❌ The bug may not be fully resolved');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testImportLogicDirect();