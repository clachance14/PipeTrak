#!/usr/bin/env tsx

import { createId } from "@paralleldrive/cuid2";
import { db as prisma } from "@repo/database";

interface MilestoneDefinition {
  name: string;
  weight: number;
  order: number;
}

interface TemplateDefinition {
  name: string;
  description: string;
  milestones: MilestoneDefinition[];
}

// ROC-aligned milestone templates based on the component type matrix
const MILESTONE_TEMPLATES: TemplateDefinition[] = [
  {
    name: "Full Milestone Set",
    description: "For spools and piping by footage",
    milestones: [
      { name: "Receive", weight: 5, order: 1 },
      { name: "Erect", weight: 30, order: 2 },
      { name: "Connect", weight: 30, order: 3 },
      { name: "Support", weight: 15, order: 4 },
      { name: "Punch", weight: 5, order: 5 },
      { name: "Test", weight: 10, order: 6 },
      { name: "Restore", weight: 5, order: 7 }
    ]
  },
  {
    name: "Reduced Milestone Set", 
    description: "For valves, gaskets, supports, instruments",
    milestones: [
      { name: "Receive", weight: 10, order: 1 },
      { name: "Install", weight: 60, order: 2 },
      { name: "Punch", weight: 10, order: 3 },
      { name: "Test", weight: 15, order: 4 },
      { name: "Restore", weight: 5, order: 5 }
    ]
  },
  {
    name: "Field Weld",
    description: "For field welds",
    milestones: [
      { name: "Fit-up Ready", weight: 10, order: 1 },
      { name: "Weld", weight: 60, order: 2 },
      { name: "Punch", weight: 10, order: 3 },
      { name: "Test", weight: 15, order: 4 },
      { name: "Restore", weight: 5, order: 5 }
    ]
  },
  {
    name: "Insulation",
    description: "For insulation work",
    milestones: [
      { name: "Insulate", weight: 60, order: 1 },
      { name: "Metal Out", weight: 40, order: 2 }
    ]
  },
  {
    name: "Paint",
    description: "For paint/coating work",
    milestones: [
      { name: "Primer", weight: 40, order: 1 },
      { name: "Finish Coat", weight: 60, order: 2 }
    ]
  }
];

function validateTemplate(template: TemplateDefinition): void {
  const totalWeight = template.milestones.reduce((sum, m) => sum + m.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(`Template "${template.name}" weights sum to ${totalWeight}%, not 100%`);
  }
  
  // Check for duplicate orders
  const orders = template.milestones.map(m => m.order);
  if (new Set(orders).size !== orders.length) {
    throw new Error(`Template "${template.name}" has duplicate milestone orders`);
  }
}

async function createMilestoneTemplatesForProject(projectId: string): Promise<Map<string, any>> {
  const templateMap = new Map();
  
  console.log(`Creating milestone templates for project ${projectId}...`);
  
  for (const templateDef of MILESTONE_TEMPLATES) {
    // Validate template before creation
    validateTemplate(templateDef);
    
    // Check if template already exists for this project
    const existing = await prisma.milestoneTemplate.findFirst({
      where: {
        projectId,
        name: templateDef.name
      }
    });
    
    if (existing) {
      console.log(`Template "${templateDef.name}" already exists, skipping...`);
      templateMap.set(templateDef.name, existing);
      continue;
    }
    
    const template = await prisma.milestoneTemplate.create({
      data: {
        id: createId(),
        projectId,
        name: templateDef.name,
        description: templateDef.description,
        milestones: templateDef.milestones,
        isDefault: templateDef.name === "Full Milestone Set" // Set Full as default
      }
    });
    
    templateMap.set(templateDef.name, template);
    console.log(`✅ Created template: ${templateDef.name} (${templateDef.milestones.length} milestones, ${templateDef.milestones.reduce((s, m) => s + m.weight, 0)}% total weight)`);
  }
  
  return templateMap;
}

async function createTemplatesForAllProjects(): Promise<void> {
  console.log("Finding all projects...");
  
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      jobName: true,
      jobNumber: true
    }
  });
  
  if (projects.length === 0) {
    console.log("No projects found. Create a project first.");
    return;
  }
  
  console.log(`Found ${projects.length} projects`);
  
  for (const project of projects) {
    console.log(`\n--- Processing ${project.jobName} (${project.jobNumber}) ---`);
    await createMilestoneTemplatesForProject(project.id);
  }
  
  console.log("\n🎉 All milestone templates created successfully!");
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: tsx create-milestone-templates.ts [options]

Options:
  --project-id ID    Create templates for specific project ID
  --all             Create templates for all projects (default)
  --help, -h        Show this help message

Examples:
  tsx create-milestone-templates.ts --all
  tsx create-milestone-templates.ts --project-id clxyz123
    `);
    return;
  }
  
  const projectIdIndex = args.indexOf("--project-id");
  
  try {
    if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
      const projectId = args[projectIdIndex + 1];
      console.log(`Creating templates for project: ${projectId}`);
      await createMilestoneTemplatesForProject(projectId);
    } else {
      await createTemplatesForAllProjects();
    }
  } catch (error) {
    console.error("❌ Error creating milestone templates:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other scripts
export { 
  createMilestoneTemplatesForProject, 
  MILESTONE_TEMPLATES,
  validateTemplate 
};

if (require.main === module) {
  main();
}