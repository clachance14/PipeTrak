#!/usr/bin/env tsx

import { db as prisma } from '@repo/database';
import fs from 'fs';
import path from 'path';

async function testFullImportAPI() {
  try {
    console.log('🧪 Testing Full Import API with Template Assignment...\n');

    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true, organizationId: true }
    });

    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }

    console.log(`Using project: ${project.jobName} (${project.id})\n`);

    // Read the test CSV file
    const csvPath = path.join(process.cwd(), '../../test-template-assignment.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`Test CSV file not found at: ${csvPath}`);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvBuffer = Buffer.from(csvContent);
    const base64Data = csvBuffer.toString('base64');

    // Simulate the import request payload
    const importPayload = {
      projectId: project.id,
      fileData: {
        buffer: base64Data,
        mimetype: 'text/csv'
      },
      mappings: [
        { csvHeader: 'componentId', dbColumn: 'componentId' },
        { csvHeader: 'type', dbColumn: 'type' },
        { csvHeader: 'workflowType', dbColumn: 'workflowType' },
        { csvHeader: 'drawingId', dbColumn: 'drawingId' },
        { csvHeader: 'spec', dbColumn: 'spec' },
        { csvHeader: 'size', dbColumn: 'size' },
        { csvHeader: 'material', dbColumn: 'material' },
        { csvHeader: 'area', dbColumn: 'area' },
        { csvHeader: 'system', dbColumn: 'system' },
        { csvHeader: 'description', dbColumn: 'description' },
        { csvHeader: 'totalQuantity', dbColumn: 'totalQuantity' }
      ],
      options: {
        skipDuplicates: true,
        updateExisting: false,
        rollbackOnError: false
      }
    };

    console.log('📤 Making import API call...');
    
    // Make the API call to localhost:3006
    const response = await fetch('http://localhost:3006/api/pipetrak/components/import-full', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real scenarios, you'd need authentication headers
      },
      body: JSON.stringify(importPayload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Import API call failed:', response.status, response.statusText);
      console.error('Response:', result);
      return;
    }

    console.log('✅ Import API Response:');
    console.log('─'.repeat(70));
    console.log(JSON.stringify(result, null, 2));
    console.log('─'.repeat(70));

    // Check if import was successful
    if (result.success) {
      console.log('\n🎉 Import completed successfully!');
      console.log(`Created: ${result.summary.created} components`);
      console.log(`Updated: ${result.summary.updated} components`);
      console.log(`Skipped: ${result.summary.skipped} components`);
      console.log(`Errors: ${result.summary.errors} errors`);

      // Now verify the template assignments
      console.log('\n🔍 Verifying Template Assignments...');
      const importedComponents = await prisma.component.findMany({
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

      console.log(`Found ${importedComponents.length} imported test components:\n`);

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

      importedComponents.forEach(comp => {
        const expected = expectedMappings[comp.componentId];
        const actual = comp.milestoneTemplate?.name;
        const isCorrect = expected === actual;
        
        const status = isCorrect ? '✅' : '❌';
        const milestones = Array.isArray(comp.milestoneTemplate?.milestones) ? comp.milestoneTemplate.milestones : [];
        
        console.log(`${status} ${comp.componentId} (${comp.type})`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual:   ${actual} (${milestones.length} milestones, ${comp.milestones.length} created)`);
        
        if (isCorrect) {
          correctAssignments++;
        }
        totalComponents++;
        console.log('');
      });

      const accuracy = (correctAssignments / totalComponents) * 100;
      console.log('📊 Template Assignment Results:');
      console.log('─'.repeat(50));
      console.log(`Correct assignments: ${correctAssignments}/${totalComponents} (${accuracy.toFixed(1)}%)`);
      
      if (correctAssignments === totalComponents) {
        console.log('🎉 All template assignments are correct!');
      } else {
        console.log('⚠️  Some template assignments are incorrect');
      }

    } else {
      console.error('❌ Import failed');
      if (result.errors && result.errors.length > 0) {
        console.error('Errors:');
        result.errors.forEach((error: any) => {
          console.error(`  - ${error.componentId}: ${error.error}`);
        });
      }
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

testFullImportAPI();