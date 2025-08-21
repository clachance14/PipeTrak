#!/usr/bin/env tsx
import { db as prisma } from '@repo/database';
import fs from 'fs';

async function testImportV2Fix() {
  try {
    console.log('🧪 Testing Import V2 Fix...\n');

    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true, organizationId: true }
    });

    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }

    console.log(`Using project: ${project.jobName} (${project.id})\n`);

    // Read the Excel file
    const excelPath = './PipeTrak_Import_Template_2025-08-12 (1).xlsx';
    if (!fs.existsSync(excelPath)) {
      console.error(`Excel file not found at: ${excelPath}`);
      return;
    }

    const excelBuffer = fs.readFileSync(excelPath);
    const base64Data = excelBuffer.toString('base64');

    // Test payload
    const importPayload = {
      projectId: project.id,
      fileData: {
        buffer: base64Data,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      preview: false
    };

    console.log('📤 Testing import with preview first...');
    
    // First test preview
    const previewResponse = await fetch('http://localhost:3000/api/pipetrak/import/components-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({...importPayload, preview: true})
    });

    if (!previewResponse.ok) {
      console.error('❌ Preview failed:', previewResponse.status, previewResponse.statusText);
      const error = await previewResponse.text();
      console.error('Response:', error);
      return;
    }

    const previewResult = await previewResponse.json();
    console.log('✅ Preview Results:');
    console.log(JSON.stringify(previewResult, null, 2));

    console.log('\n📤 Now testing actual import...');
    
    // Now test actual import
    const importResponse = await fetch('http://localhost:3000/api/pipetrak/import/components-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(importPayload)
    });

    const importResult = await importResponse.json();
    
    if (!importResponse.ok) {
      console.error('❌ Import failed:', importResponse.status, importResponse.statusText);
      console.error('Response:', importResult);
      return;
    }

    console.log('✅ Import Results:');
    console.log(JSON.stringify(importResult, null, 2));

    // Check components were created
    if (importResult.success && importResult.imported > 0) {
      console.log('\n🔍 Checking created components...');
      const components = await prisma.component.findMany({
        where: { projectId: project.id },
        select: {
          componentId: true,
          instanceNumber: true,
          displayId: true,
          type: true,
          drawing: { select: { number: true } }
        },
        orderBy: [
          { componentId: 'asc' },
          { instanceNumber: 'asc' }
        ],
        take: 10
      });

      console.log(`Found ${components.length} components (showing first 10):`);
      components.forEach(comp => {
        console.log(`  ${comp.displayId} (${comp.type}) on ${comp.drawing.number}`);
      });

      // Test importing same file again to check duplicate handling
      console.log('\n📤 Testing duplicate import handling...');
      const duplicateResponse = await fetch('http://localhost:3000/api/pipetrak/import/components-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload)
      });

      const duplicateResult = await duplicateResponse.json();
      console.log('Duplicate import result:');
      console.log(JSON.stringify(duplicateResult, null, 2));
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

testImportV2Fix();