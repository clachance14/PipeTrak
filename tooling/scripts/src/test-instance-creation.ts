import { db as prisma } from '@repo/database';
import * as path from 'path';
import dotenv from 'dotenv';

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function testInstanceCreation() {
  console.log('🧪 Testing instance creation after the fix...');
  
  try {
    // First, let's find a project to use for testing
    const existingProject = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });

    if (!existingProject) {
      throw new Error('No existing project found for testing');
    }

    console.log(`📁 Using project: ${existingProject.jobName} (${existingProject.id})`);

    // Check for existing components with instance tracking
    console.log('\n🔍 Checking existing components with instance tracking...');
    
    const componentsWithInstances = await prisma.component.findMany({
      where: {
        projectId: existingProject.id,
        OR: [
          { instanceNumber: { gt: 1 } },
          { totalInstancesOnDrawing: { gt: 1 } },
          { displayId: { contains: ' (' } }
        ]
      },
      select: {
        id: true,
        componentId: true,
        instanceNumber: true,
        totalInstancesOnDrawing: true,
        displayId: true,
        drawingId: true,
        drawing: {
          select: { number: true }
        }
      },
      orderBy: [
        { drawingId: 'asc' },
        { componentId: 'asc' },
        { instanceNumber: 'asc' }
      ]
    });

    if (componentsWithInstances.length === 0) {
      console.log('❌ No components found with instance tracking!');
      console.log('   This suggests the instance creation is not working properly.');
      
      // Let's check some regular components to see what's there
      const regularComponents = await prisma.component.findMany({
        where: { projectId: existingProject.id },
        select: {
          componentId: true,
          instanceNumber: true,
          totalInstancesOnDrawing: true,
          displayId: true,
          drawing: { select: { number: true } }
        },
        take: 10
      });
      
      console.log('\n📋 Sample of existing components:');
      regularComponents.forEach(comp => {
        console.log(`  - ${comp.componentId}: instance=${comp.instanceNumber}, total=${comp.totalInstancesOnDrawing}, displayId="${comp.displayId}"`);
      });
      
    } else {
      console.log(`✅ Found ${componentsWithInstances.length} components with instance tracking:`);
      
      // Group by drawing and component ID to analyze instance sequences
      const groupedComponents = new Map<string, any[]>();
      
      componentsWithInstances.forEach(comp => {
        const key = `${comp.drawing.number}:${comp.componentId}`;
        if (!groupedComponents.has(key)) {
          groupedComponents.set(key, []);
        }
        groupedComponents.get(key)!.push(comp);
      });
      
      console.log('\n📊 Instance tracking analysis:');
      for (const [key, components] of groupedComponents) {
        const [drawingNumber, componentId] = key.split(':');
        console.log(`\n📄 Drawing ${drawingNumber} - Component ${componentId}:`);
        
        components.forEach(comp => {
          console.log(`   Instance ${comp.instanceNumber} of ${comp.totalInstancesOnDrawing}: "${comp.displayId}"`);
        });
        
        // Validate instance sequence
        const expectedInstances = components[0].totalInstancesOnDrawing;
        const actualInstances = components.length;
        const instanceNumbers = components.map(c => c.instanceNumber).sort((a, b) => a - b);
        const expectedSequence = Array.from({length: expectedInstances}, (_, i) => i + 1);
        
        const isValidSequence = JSON.stringify(instanceNumbers) === JSON.stringify(expectedSequence);
        
        if (isValidSequence) {
          console.log(`   ✅ Valid instance sequence: 1 to ${expectedInstances}`);
        } else {
          console.log(`   ❌ Invalid instance sequence. Expected: ${expectedSequence.join(', ')}, Got: ${instanceNumbers.join(', ')}`);
        }
      }
    }

    // Look for potential duplicate components (same componentId/drawing but different instance numbers)
    console.log('\n🔍 Checking for component instances on the same drawing...');
    
    const componentGroups = await prisma.component.groupBy({
      by: ['drawingId', 'componentId'],
      where: { projectId: existingProject.id },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } }
    });

    if (componentGroups.length === 0) {
      console.log('ℹ️  No duplicate componentId+drawing combinations found.');
      console.log('   This is expected if no components appear multiple times on the same drawing.');
    } else {
      console.log(`🔍 Found ${componentGroups.length} component types that appear multiple times on the same drawing:`);
      
      for (const group of componentGroups) {
        const instances = await prisma.component.findMany({
          where: {
            drawingId: group.drawingId,
            componentId: group.componentId
          },
          select: {
            componentId: true,
            instanceNumber: true,
            totalInstancesOnDrawing: true,
            displayId: true,
            drawing: { select: { number: true } }
          },
          orderBy: { instanceNumber: 'asc' }
        });
        
        console.log(`\n📄 ${instances[0].drawing.number} - ${group.componentId} (${group._count.id} instances):`);
        instances.forEach(instance => {
          console.log(`   ${instance.instanceNumber}: "${instance.displayId}"`);
        });
      }
    }

    console.log('\n✅ Instance creation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testInstanceCreation()
  .then(() => {
    console.log('\n🎉 Instance creation test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Instance creation test failed:', error.message);
    process.exit(1);
  });