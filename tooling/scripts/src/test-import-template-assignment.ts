#!/usr/bin/env tsx

import { db as prisma } from '@repo/database';
import fs from 'fs';
import path from 'path';

async function testImportTemplateAssignment() {
  try {
    console.log('🧪 Testing Import Template Assignment with Sample CSV...\n');

    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true }
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
    console.log('📄 Test CSV Content:');
    console.log('─'.repeat(70));
    console.log(csvContent);
    console.log('─'.repeat(70));

    // Parse CSV manually for this test
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    console.log(`\n📊 Parsed ${rows.length} test components:`);
    
    rows.forEach((row, index) => {
      const values = row.split(',');
      const componentData: any = {};
      headers.forEach((header, i) => {
        componentData[header.trim()] = values[i]?.trim();
      });
      
      console.log(`${index + 1}. ${componentData.componentId} (${componentData.type})`);
    });

    // Check current components with TEST_ prefix to see if any exist
    console.log('\n🔍 Checking for existing test components...');
    const existingTestComponents = await prisma.component.findMany({
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
      }
    });

    if (existingTestComponents.length > 0) {
      console.log(`Found ${existingTestComponents.length} existing test components:`);
      existingTestComponents.forEach(comp => {
        const milestones = Array.isArray(comp.milestoneTemplate?.milestones) ? comp.milestoneTemplate.milestones : [];
        console.log(`  ${comp.componentId} (${comp.type}) → ${comp.milestoneTemplate?.name} (${milestones.length} milestones defined, ${comp.milestones.length} created)`);
      });
      
      console.log('\n⚠️  Test components already exist. To test fresh import, delete these first or use different component IDs.');
    } else {
      console.log('✅ No existing test components found - ready for fresh import test');
    }

    // Expected template mappings based on our ROC matrix
    const expectedMappings = {
      'TEST_VALVE_001': 'Reduced Milestone Set',
      'TEST_GASKET_001': 'Reduced Milestone Set', 
      'TEST_SPOOL_001': 'Full Milestone Set',
      'TEST_FITTING_001': 'Reduced Milestone Set',
      'TEST_SUPPORT_001': 'Reduced Milestone Set',
      'TEST_FIELD_WELD_001': 'Field Weld',
      'TEST_INSULATION_001': 'Insulation',
      'TEST_PAINT_001': 'Paint'
    };

    console.log('\n📋 Expected Template Mappings:');
    console.log('─'.repeat(70));
    Object.entries(expectedMappings).forEach(([componentId, templateName]) => {
      const type = componentId.split('_')[1]; // Extract type from ID
      console.log(`${componentId.padEnd(22)} (${type.padEnd(10)}) → ${templateName}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('1. Use the import wizard in the UI to import test-template-assignment.csv');
    console.log('2. Run this script again to verify correct template assignments');
    console.log('3. Check that each component type gets the expected milestone template');
    
    console.log('\n📍 CSV file location: /home/clachance14/projects/PipeTrak/test-template-assignment.csv');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testImportTemplateAssignment();