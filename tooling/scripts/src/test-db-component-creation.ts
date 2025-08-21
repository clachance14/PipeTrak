import { db as prisma } from '@repo/database';
import { ComponentType } from '@repo/database/prisma/generated/client';
import * as path from 'path';
import dotenv from 'dotenv';

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Helper function to convert string type to ComponentType enum (same as in import-jobs.ts)
function convertToComponentType(typeString: string): ComponentType {
  const normalizedType = typeString?.toUpperCase();
  
  // Check if the normalized type exists in ComponentType enum
  if (Object.values(ComponentType).includes(normalizedType as ComponentType)) {
    return normalizedType as ComponentType;
  }
  
  // If not found, default to OTHER
  console.warn(`Unknown component type "${typeString}", defaulting to OTHER`);
  return ComponentType.OTHER;
}

async function testComponentCreation() {
  console.log('🧪 Testing component creation with ComponentType enum...');
  
  try {
    // Test data similar to what comes from Excel import
    const testComponentData = {
      componentId: 'TEST-FITTING-001',
      type: 'FITTING', // This will be a string from Excel
      workflowType: 'MILESTONE_DISCRETE' as const,
      drawingId: 'TEST-DRAWING-001',
      spec: 'TEST-SPEC',
      size: '1',
      description: 'Test fitting component',
      area: 'Test Area',
      system: 'Test System',
    };

    console.log('📋 Test component data:', testComponentData);
    console.log('🔄 Converting type string to enum:', testComponentData.type, '->', convertToComponentType(testComponentData.type));

    // Try to create a component using the same pattern as import-jobs.ts
    console.log('💾 Attempting to create component in database...');
    
    // First, we need a valid project and drawing for foreign key constraints
    // Let's find an existing project to use for testing
    const existingProject = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });

    if (!existingProject) {
      throw new Error('No existing project found for testing');
    }

    console.log(`📁 Using existing project: ${existingProject.jobName} (${existingProject.id})`);

    // Find or create a test drawing
    let testDrawing = await prisma.drawing.findFirst({
      where: {
        projectId: existingProject.id,
        number: 'TEST-DRAWING-001'
      }
    });

    if (!testDrawing) {
      console.log('📄 Creating test drawing...');
      testDrawing = await prisma.drawing.create({
        data: {
          projectId: existingProject.id,
          number: 'TEST-DRAWING-001',
          title: 'Test Drawing for Component Creation',
        }
      });
    }

    console.log(`📄 Using drawing: ${testDrawing.number} (${testDrawing.id})`);

    // Find a milestone template
    const milestoneTemplate = await prisma.milestoneTemplate.findFirst({
      where: { projectId: existingProject.id }
    });

    if (!milestoneTemplate) {
      throw new Error('No milestone template found for testing');
    }

    console.log(`📝 Using milestone template: ${milestoneTemplate.name} (${milestoneTemplate.id})`);

    // Now try to create the component
    const component = await prisma.component.create({
      data: {
        ...testComponentData,
        type: convertToComponentType(testComponentData.type), // Convert string to enum
        projectId: existingProject.id,
        drawingId: testDrawing.id,
        milestoneTemplateId: milestoneTemplate.id,
        instanceNumber: 1,
        totalInstancesOnDrawing: 1,
        displayId: testComponentData.componentId,
        status: 'NOT_STARTED',
        completionPercent: 0,
      },
    });

    console.log('✅ Component created successfully!');
    console.log('📊 Created component:', {
      id: component.id,
      componentId: component.componentId,
      type: component.type,
      workflowType: component.workflowType,
    });

    // Clean up test component
    console.log('🧹 Cleaning up test component...');
    await prisma.component.delete({
      where: { id: component.id }
    });

    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testComponentCreation()
  .then(() => {
    console.log('\n🎉 Component creation test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Component creation test failed:', error.message);
    process.exit(1);
  });