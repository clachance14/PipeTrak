#!/usr/bin/env tsx

import { MilestoneTemplateMapper } from '@repo/api/src/lib/milestone-template-mapper';
import { db as prisma } from '@repo/database';

async function testTitleCaseMapping() {
  try {
    console.log('🧪 Testing Title-Case Component Type Mapping...\n');
    
    // Get a project to test with
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true }
    });
    
    if (!project) {
      console.error('No project found. Please create a project first.');
      return;
    }
    
    console.log(`Testing with project: ${project.jobName} (${project.id})\n`);
    
    // Initialize the template mapper
    console.log('🎯 Initializing milestone template mapper...');
    const mapper = new MilestoneTemplateMapper(project.id);
    await mapper.loadTemplates();
    
    const stats = mapper.getStats();
    console.log(`Loaded ${stats.totalTemplates} templates: ${stats.templateNames.join(', ')}\n`);
    
    // Test the exact component types found in the Excel file
    const realWorldTypes = [
      'Support',     // 330 components in Excel
      'Gasket',      // 23 components in Excel
      'Valve',       // 22 components in Excel
      'Flange',      // 9 components in Excel
      'Fitting',     // 3 components in Excel
      'Instrument'   // 1 component in Excel
    ];
    
    // Expected mappings based on ROC matrix
    const expectedMappings = {
      'Support': 'Reduced Milestone Set',
      'Gasket': 'Reduced Milestone Set',
      'Valve': 'Reduced Milestone Set',
      'Flange': 'Reduced Milestone Set',
      'Fitting': 'Reduced Milestone Set',
      'Instrument': 'Reduced Milestone Set'
    };
    
    console.log('📋 Testing Real-World Excel Component Types:');
    console.log('─'.repeat(80));
    
    let successCount = 0;
    let totalTests = 0;
    
    for (const type of realWorldTypes) {
      totalTests++;
      const template = mapper.getTemplateForComponentType(type);
      const expected = expectedMappings[type as keyof typeof expectedMappings];
      
      if (template) {
        const isCorrect = template.name === expected;
        const status = isCorrect ? '✅' : '❌';
        
        console.log(`${status} "${type}" → "${template.name}" (${template.milestones.length} milestones)`);
        
        if (isCorrect) {
          successCount++;
          // Show milestone names for verification
          const milestoneNames = template.milestones.map((m: any) => m.name).join(', ');
          console.log(`     Milestones: ${milestoneNames}`);
        } else {
          console.log(`     Expected: "${expected}", Got: "${template.name}"`);
        }
      } else {
        console.log(`❌ "${type}" → NO TEMPLATE FOUND`);
        console.log(`     Expected: "${expected}"`);
      }
      console.log('');
    }
    
    // Test uppercase variations as well
    console.log('📋 Testing Uppercase Variations:');
    console.log('─'.repeat(80));
    
    const uppercaseTypes = realWorldTypes.map(type => type.toUpperCase());
    
    for (const type of uppercaseTypes) {
      totalTests++;
      const template = mapper.getTemplateForComponentType(type);
      const originalType = type.charAt(0) + type.slice(1).toLowerCase(); // Convert back to title case for lookup
      const expected = expectedMappings[originalType as keyof typeof expectedMappings];
      
      if (template) {
        const isCorrect = template.name === expected;
        const status = isCorrect ? '✅' : '❌';
        
        console.log(`${status} "${type}" → "${template.name}" (${template.milestones.length} milestones)`);
        
        if (isCorrect) {
          successCount++;
        } else {
          console.log(`     Expected: "${expected}", Got: "${template.name}"`);
        }
      } else {
        console.log(`❌ "${type}" → NO TEMPLATE FOUND`);
        console.log(`     Expected: "${expected}"`);
      }
    }
    
    // Summary
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(50));
    const accuracy = (successCount / totalTests) * 100;
    console.log(`✅ Successful mappings: ${successCount}/${totalTests} (${accuracy.toFixed(1)}%)`);
    
    if (successCount === totalTests) {
      console.log('🎉 SUCCESS: All component types from Excel file map correctly!');
      console.log('✅ The title-case mapping fix is working!');
    } else {
      console.log('⚠️  Some mappings failed - additional fixes may be needed');
    }
    
    // Test edge cases
    console.log('\n🔍 Testing Edge Cases:');
    console.log('─'.repeat(50));
    
    const edgeCases = [
      '',              // Empty string
      '  Support  ',   // With whitespace
      'support',       // Lowercase
      'SUPPORT',       // Uppercase
      'UnknownType',   // Unknown type
      null,            // Null value
      123              // Non-string value
    ];
    
    edgeCases.forEach(testCase => {
      try {
        const template = mapper.getTemplateForComponentType(testCase as any);
        if (template) {
          console.log(`✅ "${testCase}" → ${template.name} (fallback handled correctly)`);
        } else {
          console.log(`⚠️  "${testCase}" → No template (this should not happen)`);
        }
      } catch (error) {
        console.log(`❌ "${testCase}" → Error: ${(error as Error).message}`);
      }
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testTitleCaseMapping();