import { db as prisma } from '@repo/database';
import { ExcelProcessor, ColumnMapper, DataValidator, TemplateResolver } from '../../../packages/api/src/lib/file-processing';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function testFullImport() {
  console.log('🧪 Testing full Excel import with drawing creation...');
  
  try {
    // Use the same Excel file
    const filePath = '/home/clachance14/projects/PipeTrak/PipeTrak_Import_Template_2025-08-12 (1).xlsx';
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at: ${filePath}`);
    }
    
    console.log('📄 Reading Excel file...');
    const buffer = fs.readFileSync(filePath);
    
    // Parse Excel
    const excelProcessor = new ExcelProcessor();
    const { headers, rows, metadata } = await excelProcessor.parseExcel(buffer);
    console.log(`✅ Excel parsed: ${headers.length} columns, ${rows.length} rows`);
    
    // Auto-map columns
    const mapper = new ColumnMapper();
    const mappings = mapper.autoMapColumns(headers);
    console.log('🔗 Column mappings found:', mappings.length);
    
    // Take just first 5 rows for testing
    const testRows = rows.slice(0, 5);
    console.log(`📊 Testing with ${testRows.length} components`);
    
    // Find an existing project to use
    const existingProject = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });

    if (!existingProject) {
      throw new Error('No existing project found for testing');
    }

    console.log(`📁 Using project: ${existingProject.jobName} (${existingProject.id})`);
    
    // Extract unique drawing numbers (simulate the new logic)
    console.log('🔍 Extracting drawing numbers...');
    const uniqueDrawingNumbers = new Set<string>();
    
    for (const row of testRows) {
      const drawingMapping = mappings.find(m => m.targetField === 'drawingId');
      if (drawingMapping && row[drawingMapping.sourceColumn]) {
        const drawingNumber = row[drawingMapping.sourceColumn].toString().trim();
        if (drawingNumber) {
          uniqueDrawingNumbers.add(drawingNumber);
        }
      }
    }
    
    console.log(`📋 Found ${uniqueDrawingNumbers.size} unique drawing numbers:`, Array.from(uniqueDrawingNumbers));
    
    // Create missing drawings
    console.log('🏗️  Creating/finding drawings...');
    const drawingNumberToIdMap = new Map<string, string>();
    
    for (const drawingNumber of uniqueDrawingNumbers) {
      let drawing = await prisma.drawing.findFirst({
        where: {
          projectId: existingProject.id,
          number: drawingNumber,
        },
        select: { id: true, number: true },
      });
      
      if (!drawing) {
        console.log(`   Creating drawing: ${drawingNumber}`);
        drawing = await prisma.drawing.create({
          data: {
            projectId: existingProject.id,
            number: drawingNumber,
            title: `Auto-created drawing ${drawingNumber}`,
          },
          select: { id: true, number: true },
        });
      } else {
        console.log(`   Found existing drawing: ${drawingNumber}`);
      }
      
      drawingNumberToIdMap.set(drawingNumber, drawing.id);
    }
    
    console.log(`✅ Drawing mapping created with ${drawingNumberToIdMap.size} entries`);
    
    // Validate components with drawing numbers
    const validator = new DataValidator();
    const validation = await validator.validateComponentData(
      testRows,
      mappings,
      {
        projectId: existingProject.id,
        existingDrawings: new Set(Array.from(drawingNumberToIdMap.keys())),
      }
    );
    
    console.log(`📊 Validation: ${validation.validRows.length} valid, ${validation.errors.length} errors`);
    
    if (validation.errors.length > 0) {
      console.log('❌ Validation errors:');
      validation.errors.slice(0, 3).forEach(error => {
        console.log(`   Row ${error.row}: ${error.field} - ${error.error}`);
      });
    }
    
    // Ensure templates exist
    console.log('📝 Ensuring milestone templates exist...');
    const templates = await TemplateResolver.ensureTemplatesExist(existingProject.id);
    console.log(`✅ Templates ready: ${templates.size} templates available`);
    
    // Assign templates and convert drawing numbers to IDs
    console.log('🔄 Processing components...');
    const processedComponents = validation.validRows.map(component => {
      // Assign template if missing
      if (!component.milestoneTemplateId) {
        component.milestoneTemplateId = TemplateResolver.resolveTemplateForComponent(
          component.type,
          component.componentId,
          templates
        );
      }
      
      // Convert drawing number to ID
      if (component.drawingId) {
        const drawingId = drawingNumberToIdMap.get(component.drawingId);
        if (drawingId) {
          component.drawingId = drawingId;
        }
      }
      
      return component;
    });
    
    console.log(`✅ Processed ${processedComponents.length} components`);
    console.log('📋 Sample processed component:', {
      componentId: processedComponents[0].componentId,
      type: processedComponents[0].type,
      drawingId: processedComponents[0].drawingId,
      milestoneTemplateId: processedComponents[0].milestoneTemplateId,
    });
    
    // Try to create one component in the database
    console.log('💾 Testing component creation...');
    const testComponent = processedComponents[0];
    
    const createdComponent = await prisma.component.create({
      data: {
        projectId: existingProject.id,
        componentId: `TEST-${testComponent.componentId}-${Date.now()}`,
        type: testComponent.type as any,
        workflowType: testComponent.workflowType as any,
        drawingId: testComponent.drawingId,
        milestoneTemplateId: testComponent.milestoneTemplateId,
        spec: testComponent.spec,
        size: testComponent.size,
        description: testComponent.description,
        area: testComponent.area,
        system: testComponent.system,
        instanceNumber: 1,
        displayId: `TEST-${testComponent.componentId}`,
        status: 'NOT_STARTED',
        completionPercent: 0,
      },
    });
    
    console.log('✅ Component created successfully!');
    console.log('📊 Created component:', {
      id: createdComponent.id,
      componentId: createdComponent.componentId,
      type: createdComponent.type,
      drawingId: createdComponent.drawingId,
    });
    
    // Clean up test component
    console.log('🧹 Cleaning up test component...');
    await prisma.component.delete({
      where: { id: createdComponent.id }
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testFullImport()
  .then(() => {
    console.log('\n🎉 Full import test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Full import test failed:', error.message);
    process.exit(1);
  });