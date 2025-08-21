import { db as prisma } from '@repo/database';
import { MilestoneTemplateMapper } from '@repo/api/src/lib/milestone-template-mapper';

async function testMilestoneAssignmentFix() {
  try {
    console.log('🧪 Testing Milestone Template Assignment Fix...\n');
    
    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });
    
    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }
    
    console.log(`Testing with project: ${project.jobName} (${project.id})\n`);
    
    // Test the milestone template mapper
    console.log('🔍 Testing MilestoneTemplateMapper...');
    const mapper = new MilestoneTemplateMapper(project.id);
    await mapper.loadTemplates();
    
    const stats = mapper.getStats();
    console.log(`Loaded ${stats.totalTemplates} templates: ${stats.templateNames.join(', ')}\n`);
    
    // Test mappings for different component types
    const testComponentTypes = [
      'VALVE',
      'GASKET', 
      'SUPPORT',
      'FITTING',
      'INSTRUMENT',
      'SPOOL',
      'PIPING',
      'FIELD_WELD',
      'INSULATION',
      'PAINT',
      'UNKNOWN_TYPE'
    ];
    
    console.log('📋 Component Type → Template Mapping:');
    console.log('─'.repeat(70));
    
    testComponentTypes.forEach(type => {
      const template = mapper.getTemplateForComponentType(type);
      if (template) {
        console.log(`${type.padEnd(15)} → ${template.name.padEnd(25)} (${template.milestones.length} milestones)`);
        
        // Show milestone names for a few key types
        if (['VALVE', 'SPOOL', 'FIELD_WELD'].includes(type)) {
          const milestoneNames = template.milestones.map((m: any) => m.name).join(', ');
          console.log(`${' '.repeat(17)}Milestones: ${milestoneNames}`);
        }
      } else {
        console.log(`${type.padEnd(15)} → ❌ NO TEMPLATE FOUND`);
      }
    });
    
    // Check actual components in database to see their current template assignments
    console.log('\n📊 Current Database State:');
    console.log('─'.repeat(70));
    
    const componentsByTemplate = await prisma.component.groupBy({
      by: ['milestoneTemplateId'],
      _count: { id: true },
      where: { projectId: project.id }
    });
    
    for (const group of componentsByTemplate) {
      const template = await prisma.milestoneTemplate.findUnique({
        where: { id: group.milestoneTemplateId },
        select: { name: true, milestones: true }
      });
      
      const milestones = Array.isArray(template?.milestones) ? template.milestones : [];
      console.log(`${template?.name || 'Unknown'}: ${group._count.id} components (${milestones.length} milestones)`);
    }
    
    // Show some sample components with their types and templates
    console.log('\n🔍 Sample Components:');
    console.log('─'.repeat(70));
    
    const sampleComponents = await prisma.component.findMany({
      take: 15,
      where: { projectId: project.id },
      include: {
        milestoneTemplate: {
          select: { name: true, milestones: true }
        },
        milestones: {
          select: { milestoneName: true },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    sampleComponents.forEach(comp => {
      const milestones = Array.isArray(comp.milestoneTemplate?.milestones) ? comp.milestoneTemplate.milestones : [];
      console.log(`${comp.componentId} (${comp.type || 'No Type'})`);
      console.log(`  Template: ${comp.milestoneTemplate?.name || 'None'} (${milestones.length} defined, ${comp.milestones.length} created)`);
      
      if (comp.milestones.length > 0) {
        const milestoneNames = comp.milestones.map(m => m.milestoneName).join(', ');
        console.log(`  Milestones: ${milestoneNames}`);
      }
      console.log('');
    });
    
    // Summary and recommendations
    console.log('🎯 Analysis Summary:');
    console.log('─'.repeat(70));
    
    const totalComponents = await prisma.component.count({ where: { projectId: project.id } });
    const componentsWithMilestones = await prisma.component.count({
      where: {
        projectId: project.id,
        milestones: { some: {} }
      }
    });
    
    console.log(`Total components: ${totalComponents}`);
    console.log(`Components with milestones: ${componentsWithMilestones}`);
    console.log(`Coverage: ${((componentsWithMilestones / totalComponents) * 100).toFixed(1)}%`);
    
    if (componentsWithMilestones === totalComponents) {
      console.log('\n✅ All components have milestones assigned!');
    } else {
      console.log('\n⚠️  Some components are missing milestones');
    }
    
    // Check if we have variety in template usage
    if (componentsByTemplate.length > 1) {
      console.log('✅ Multiple milestone templates are being used');
    } else {
      console.log('⚠️  Only one milestone template is being used (may indicate the fix needs to be applied)');
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

testMilestoneAssignmentFix();