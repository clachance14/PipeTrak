#!/usr/bin/env tsx

import { db as prisma } from "@repo/database";
import { createMilestoneTemplatesForProject } from "./create-milestone-templates";
import { resolveTemplateForComponent, analyzeComponentTypes } from "./lib/template-resolver";

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function runTest(testName: string, testFn: () => Promise<TestResult>): Promise<void> {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    const result = await testFn();
    if (result.passed) {
      console.log(`✅ PASS: ${result.message}`);
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    } else {
      console.log(`❌ FAIL: ${result.message}`);
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR: ${testName} - ${error}`);
  }
}

async function testTemplateCreation(): Promise<TestResult> {
  // Get a test project
  const project = await prisma.project.findFirst();
  if (!project) {
    return { passed: false, message: "No project found to test with" };
  }

  // Create templates
  const templates = await createMilestoneTemplatesForProject(project.id);
  
  // Verify all 5 templates exist
  const expectedTemplates = [
    "Full Milestone Set",
    "Reduced Milestone Set", 
    "Field Weld",
    "Insulation",
    "Paint"
  ];
  
  const existingTemplates = Array.from(templates.keys());
  const missingTemplates = expectedTemplates.filter(name => !existingTemplates.includes(name));
  
  if (missingTemplates.length > 0) {
    return { 
      passed: false, 
      message: `Missing templates: ${missingTemplates.join(", ")}`,
      details: { existing: existingTemplates, missing: missingTemplates }
    };
  }
  
  // Verify weights sum to 100% for each template
  const weightErrors = [];
  for (const [name, template] of templates.entries()) {
    const milestones = JSON.parse(template.milestones as string);
    const totalWeight = milestones.reduce((sum: number, m: any) => sum + m.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      weightErrors.push(`${name}: ${totalWeight}%`);
    }
  }
  
  if (weightErrors.length > 0) {
    return {
      passed: false,
      message: `Template weights don't sum to 100%: ${weightErrors.join(", ")}`,
      details: { weightErrors }
    };
  }
  
  return { 
    passed: true, 
    message: `All ${expectedTemplates.length} templates created with correct weights`,
    details: { templates: existingTemplates }
  };
}

async function testTemplateResolution(): Promise<TestResult> {
  const project = await prisma.project.findFirst();
  if (!project) {
    return { passed: false, message: "No project found to test with" };
  }

  const templates = await createMilestoneTemplatesForProject(project.id);
  
  const testCases = [
    // Gaskets should get Reduced template
    { type: "GASKET", id: "GK123", expected: "Reduced Milestone Set" },
    { type: "VALVE", id: "VLV456", expected: "Reduced Milestone Set" },
    { type: "SUPPORT", id: "H-001", expected: "Reduced Milestone Set" },
    { type: "INSTRUMENT", id: "PT-102", expected: "Reduced Milestone Set" },
    
    // Pipes should get Full template
    { type: "SPOOL", id: "SP001", expected: "Full Milestone Set" },
    { type: "PIPE", id: "L-101", expected: "Full Milestone Set" },
    
    // Field welds should get Field Weld template
    { type: "FIELD_WELD", id: "FW001", expected: "Field Weld" },
    
    // Pattern-based matching
    { type: "UNKNOWN", id: "GKT-123", expected: "Reduced Milestone Set" }, // GKT pattern
    { type: "UNKNOWN", id: "VLV-456", expected: "Reduced Milestone Set" }, // VLV pattern
  ];
  
  const failures = [];
  
  for (const testCase of testCases) {
    const resolvedId = resolveTemplateForComponent(
      testCase.type,
      testCase.id,
      undefined,
      templates
    );
    
    const resolvedTemplate = Array.from(templates.values()).find(t => t.id === resolvedId);
    const resolvedName = resolvedTemplate?.name || "Unknown";
    
    if (resolvedName !== testCase.expected) {
      failures.push({
        case: testCase,
        got: resolvedName,
        expected: testCase.expected
      });
    }
  }
  
  if (failures.length > 0) {
    return {
      passed: false,
      message: `${failures.length} template resolution failures`,
      details: { failures }
    };
  }
  
  return {
    passed: true,
    message: `All ${testCases.length} template resolution cases passed`,
    details: { testCases }
  };
}

async function testGasketFix(): Promise<TestResult> {
  // Find gaskets that might be using wrong templates
  const gaskets = await prisma.component.findMany({
    where: {
      OR: [
        { type: { contains: "GASKET", mode: "insensitive" } },
        { type: { contains: "GKT", mode: "insensitive" } },
        { componentId: { startsWith: "GK" } }
      ]
    },
    include: {
      milestoneTemplate: true,
      milestones: true
    },
    take: 10 // Just test a few
  });
  
  if (gaskets.length === 0) {
    return { 
      passed: true, 
      message: "No gaskets found to test (expected if none exist)" 
    };
  }
  
  const issues = [];
  
  for (const gasket of gaskets) {
    // Check if using wrong template
    if (gasket.milestoneTemplate.name === "Standard Piping") {
      issues.push({
        componentId: gasket.componentId,
        issue: "Still using Standard Piping template",
        currentTemplate: gasket.milestoneTemplate.name
      });
    }
    
    // Check for wrong milestone names
    const wrongMilestones = gasket.milestones.filter(m => 
      ["Fit-up", "Welded", "Insulated"].includes(m.milestoneName)
    );
    
    if (wrongMilestones.length > 0) {
      issues.push({
        componentId: gasket.componentId,
        issue: "Has wrong milestone names",
        wrongMilestones: wrongMilestones.map(m => m.milestoneName)
      });
    }
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: `Found ${issues.length} gaskets with wrong templates/milestones`,
      details: { gaskets: gaskets.length, issues }
    };
  }
  
  return {
    passed: true,
    message: `All ${gaskets.length} gaskets have correct templates`,
    details: { gaskets: gaskets.length }
  };
}

async function testImportSystemIntegration(): Promise<TestResult> {
  const project = await prisma.project.findFirst();
  if (!project) {
    return { passed: false, message: "No project found to test with" };
  }

  // Test the import system template resolver
  const testComponents = [
    { type: "GASKET", componentId: "GK-001" },
    { type: "VALVE", componentId: "V-101" },
    { type: "SPOOL", componentId: "SP-001" },
    { type: "PIPE", componentId: "L-201" },
  ];
  
  try {
    // Skip import test as TemplateResolver not available
    /*const processedComponents = await TemplateResolver.processComponentsForImport(
      testComponents,
      project.id
    );*/
    
    // Verify all components got template IDs
    //const withoutTemplates = processedComponents.filter(c => !c.milestoneTemplateId);
    
    if (withoutTemplates.length > 0) {
      return {
        passed: false,
        message: `${withoutTemplates.length} components didn't get templates assigned`,
        details: { withoutTemplates }
      };
    }
    
    // Verify correct template assignments
    const templates = await TemplateResolver.loadTemplatesForProject(project.id);
    const reducedTemplate = templates.get("Reduced Milestone Set");
    const fullTemplate = templates.get("Full Milestone Set");
    
    const gasket = processedComponents.find(c => c.type === "GASKET");
    const spool = processedComponents.find(c => c.type === "SPOOL");
    
    const issues = [];
    if (gasket && gasket.milestoneTemplateId !== reducedTemplate?.id) {
      issues.push("Gasket didn't get Reduced template");
    }
    if (spool && spool.milestoneTemplateId !== fullTemplate?.id) {
      issues.push("Spool didn't get Full template");
    }
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: `Template assignment issues: ${issues.join(", ")}`,
        details: { issues, processedComponents }
      };
    }
    
    return {
      passed: true,
      message: `Import system correctly assigned templates to all ${processedComponents.length} components`,
      details: { processedComponents: processedComponents.length }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: `Import system failed: ${error}`,
      details: { error }
    };
  }
}

async function testComponentAnalysis(): Promise<TestResult> {
  const components = await prisma.component.findMany({
    select: {
      type: true,
      componentId: true
    },
    take: 100
  });
  
  if (components.length === 0) {
    return { 
      passed: true, 
      message: "No components found to analyze (expected if none exist)" 
    };
  }
  
  const analysis = analyzeComponentTypes(components);
  
  // Check that gaskets get Reduced template
  const gasketTypes = Object.keys(analysis).filter(type => 
    type.includes("GASKET") || type.includes("GKT")
  );
  
  const gasketIssues = [];
  for (const type of gasketTypes) {
    if (analysis[type].template !== "Reduced Milestone Set") {
      gasketIssues.push(`${type} → ${analysis[type].template}`);
    }
  }
  
  if (gasketIssues.length > 0) {
    return {
      passed: false,
      message: `Gasket types getting wrong templates: ${gasketIssues.join(", ")}`,
      details: { analysis, gasketIssues }
    };
  }
  
  return {
    passed: true,
    message: `Component type analysis looks correct for ${Object.keys(analysis).length} types`,
    details: { 
      totalTypes: Object.keys(analysis).length,
      totalComponents: components.length,
      analysis 
    }
  };
}

async function main() {
  console.log("🚀 Running Milestone Template Fix Tests");
  console.log("=" .repeat(60));
  
  await runTest("Template Creation", testTemplateCreation);
  await runTest("Template Resolution", testTemplateResolution);
  await runTest("Gasket Template Fix", testGasketFix);
  await runTest("Import System Integration", testImportSystemIntegration);
  await runTest("Component Type Analysis", testComponentAnalysis);
  
  console.log("\n" + "=" .repeat(60));
  console.log("🏁 Test suite completed!");
  console.log("\nNext steps if tests pass:");
  console.log("1. Run: tsx fix-component-templates.ts --dry-run --all");
  console.log("2. Run: tsx fix-component-templates.ts --all");
  console.log("3. Verify gaskets show Install milestone instead of Fit-up/Welded");
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}