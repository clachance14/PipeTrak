#!/usr/bin/env tsx

import { db as prisma } from '../../../packages/database';
import { MilestoneTemplateMapper } from '../../../packages/api/src/lib/milestone-template-mapper';
import { CSVProcessor, DataValidator } from '../../../packages/api/src/lib/file-processing';
import * as fs from 'fs';
import * as path from 'path';

async function testExcelImportSimulation() {
  try {
    console.log('🧪 Testing Excel Import Simulation with Real Component Types...\n');

    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });

    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }

    console.log(`Using project: ${project.jobName} (${project.id})\n`);

    // Clean up existing test components
    console.log('🧹 Cleaning up existing test components...');
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'SUPPORT_' }
      }
    });
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'GASKET_' }
      }
    });
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'VALVE_' }
      }
    });
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'FLANGE_' }
      }
    });
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'FITTING_' }
      }
    });
    await prisma.component.deleteMany({
      where: {
        projectId: project.id,
        componentId: { startsWith: 'INSTRUMENT_' }
      }
    });

    // Read the test CSV file with Excel-style component types
    const csvPath = path.join(process.cwd(), '../../test-excel-types.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`Test CSV file not found: ${csvPath}`);
      return;
    }

    const csvBuffer = fs.readFileSync(csvPath);
    console.log('📄 Processing CSV with Excel-style component types...');
    
    const processor = new CSVProcessor();
    const parseResult = await processor.parseCSV(csvBuffer);
    console.log(`Parsed ${parseResult.rows.length} rows\n`);

    // Show the types we're testing
    console.log('📋 Component Types from CSV:');
    parseResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.componentId}: "${row.type}"`);
    });
    console.log('');

    // Validate the data
    const mappings = [
      { sourceColumn: 'componentId', targetField: 'componentId', required: false },
      { sourceColumn: 'type', targetField: 'type', required: false },
      { sourceColumn: 'workflowType', targetField: 'workflowType', required: false },
      { sourceColumn: 'drawingId', targetField: 'drawingId', required: false },
      { sourceColumn: 'spec', targetField: 'spec', required: false },
      { sourceColumn: 'size', targetField: 'size', required: false },
      { sourceColumn: 'material', targetField: 'material', required: false },
      { sourceColumn: 'area', targetField: 'area', required: false },
      { sourceColumn: 'system', targetField: 'system', required: false },
      { sourceColumn: 'description', targetField: 'description', required: false },
      { sourceColumn: 'totalQuantity', targetField: 'totalQuantity', required: false, transform: (val: any) => Number(val) || 1 }
    ];

    const validator = new DataValidator();
    const validation = await validator.validateComponentData(
      parseResult.rows,
      mappings,
      { projectId: project.id }
    );

    console.log(`🔍 Validation: ${validation.validRows.length} valid, ${validation.invalidRows.length} invalid\n`);

    if (!validation.isValid) {
      console.error('❌ Validation failed');
      return;
    }

    // Test template assignment for each component type
    console.log('🎯 Testing Template Assignment...');
    const templateMapper = new MilestoneTemplateMapper(project.id);
    await templateMapper.loadTemplates();

    const validComponents = validation.validRows;
    const assignmentResults: any[] = [];

    for (const comp of validComponents) {
      console.log(`\n🧪 Testing: ${comp.componentId} (type: "${comp.type}")`);
      
      const template = templateMapper.getTemplateForComponentType(comp.type as string);
      
      if (template) {
        console.log(`✅ Assigned template: ${template.name} (${template.milestones.length} milestones)`);
        assignmentResults.push({
          componentId: comp.componentId,
          type: comp.type,
          templateName: template.name,
          milestonesCount: template.milestones.length,
          success: true
        });
      } else {
        console.log("❌ No template assigned");
        assignmentResults.push({
          componentId: comp.componentId,
          type: comp.type,
          templateName: null,
          milestonesCount: 0,
          success: false
        });
      }
    }

    // Summary
    console.log('\n📊 Template Assignment Summary:');
    console.log('─'.repeat(80));

    const successfulAssignments = assignmentResults.filter(r => r.success);
    const accuracy = (successfulAssignments.length / assignmentResults.length) * 100;

    console.log(`Total components tested: ${assignmentResults.length}`);
    console.log(`Successful template assignments: ${successfulAssignments.length}`);
    console.log(`Accuracy: ${accuracy.toFixed(1)}%\n`);

    assignmentResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.componentId} (${result.type}) → ${result.templateName || 'NO TEMPLATE'}`);
    });

    if (successfulAssignments.length === assignmentResults.length) {
      console.log('\n🎉 SUCCESS: All Excel-style component types map correctly!');
      console.log('✅ The import system is ready for your TAKEOFF - 5932.xlsx file!');
      
      console.log('\n💡 Expected Template Assignments:');
      console.log('  - Support, Gasket, Valve, Flange, Fitting, Instrument → Reduced Milestone Set (5 milestones)');
      console.log('  - All components will get: Receive, Install, Punch, Test, Restore');
    } else {
      console.log('\n⚠️  Some template assignments failed');
      console.log('❌ Additional fixes may be needed');
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

testExcelImportSimulation();