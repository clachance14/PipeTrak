import { db as prisma } from '@repo/database';

async function testWithDifferentTemplate() {
  try {
    console.log('🧪 Testing milestone assignment with different templates...\n');
    
    // Find components using different templates
    const componentsByTemplate = await prisma.component.groupBy({
      by: ['milestoneTemplateId'],
      _count: {
        id: true
      }
    });
    
    console.log('📊 Components by template:');
    console.log('─'.repeat(50));
    
    for (const group of componentsByTemplate) {
      const template = await prisma.milestoneTemplate.findUnique({
        where: { id: group.milestoneTemplateId },
        select: { name: true, milestones: true }
      });
      
      console.log(`Template: ${template?.name || 'Unknown'}`);
      console.log(`  Components: ${group._count.id}`);
      console.log(`  Template has milestones: ${Array.isArray(template?.milestones) ? template.milestones.length : 0}`);
      
      // Check a few components with this template
      const sampleComponents = await prisma.component.findMany({
        where: { milestoneTemplateId: group.milestoneTemplateId },
        take: 3,
        include: {
          milestones: {
            select: {
              milestoneName: true,
              weight: true
            }
          }
        }
      });
      
      console.log("  Sample components with milestones:");
      sampleComponents.forEach(c => {
        console.log(`    ${c.displayId || c.componentId}: ${c.milestones.length} milestones`);
        if (c.milestones.length > 0) {
          console.log(`      - ${c.milestones.map(m => m.milestoneName).join(', ')}`);
        }
      });
      
      console.log('');
    }
    
    // Summary
    const totalComponents = await prisma.component.count();
    const componentsWithMilestones = await prisma.component.count({
      where: {
        milestones: {
          some: {}
        }
      }
    });
    
    console.log('🎯 Final Summary:');
    console.log('─'.repeat(50));
    console.log(`Total components: ${totalComponents}`);
    console.log(`Components with milestones: ${componentsWithMilestones}`);
    console.log(`Success rate: ${((componentsWithMilestones / totalComponents) * 100).toFixed(1)}%`);
    
    if (componentsWithMilestones === totalComponents) {
      console.log('\n✅ SUCCESS: All components have milestones assigned!');
      console.log('The milestone assignment fix is working correctly.');
    } else {
      console.log('\n⚠️  Some components still missing milestones');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWithDifferentTemplate();