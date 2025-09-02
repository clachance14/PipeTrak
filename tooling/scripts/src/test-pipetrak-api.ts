#!/usr/bin/env npx tsx

import { db as prisma } from "@repo/database";

async function testPipeTrakAPI() {
  console.log("🔍 Testing PipeTrak API and Database...\n");

  try {
    // Check if we have the SDO Tank project
    const project = await prisma.project.findFirst({
      where: {
        name: { contains: "SDO Tank" }
      }
    });

    if (!project) {
      console.log("❌ SDO Tank project not found. Please run seed-sdo-tank.ts first.");
      return;
    }

    console.log(`✅ Found project: ${project.name} (${project.id})`);

    // Count components
    const componentCount = await prisma.component.count({
      where: { projectId: project.id }
    });

    console.log(`📦 Total components: ${componentCount}`);

    // Get component statistics by status
    const notStarted = await prisma.component.count({
      where: { 
        projectId: project.id,
        status: "NOT_STARTED"
      }
    });

    const inProgress = await prisma.component.count({
      where: { 
        projectId: project.id,
        status: "IN_PROGRESS"
      }
    });

    const completed = await prisma.component.count({
      where: { 
        projectId: project.id,
        status: "COMPLETED"
      }
    });

    console.log("\n📊 Component Status Breakdown:");
    console.log(`   - Not Started: ${notStarted}`);
    console.log(`   - In Progress: ${inProgress}`);
    console.log(`   - Completed: ${completed}`);

    // Get sample components with milestones
    const sampleComponents = await prisma.component.findMany({
      where: { projectId: project.id },
      take: 5,
      include: {
        milestones: {
          orderBy: { milestoneOrder: "asc" }
        },
        drawing: true
      }
    });

    console.log("\n📝 Sample Components:");
    sampleComponents.forEach(comp => {
      console.log(`   - ${comp.componentId}: ${comp.type} ${comp.spec || ""} ${comp.size || ""}`);
      console.log(`     Drawing: ${comp.drawing?.number || "N/A"}`);
      console.log(`     Milestones: ${comp.milestones.length}`);
      console.log(`     Progress: ${Math.round(comp.completionPercent)}%`);
    });

    // Test API endpoints via direct HTTP
    console.log("\n🌐 Testing API Endpoints:");
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Use this to test: http://localhost:3000/api/pipetrak/components?projectId=${project.id}`);

    // Check drawings
    const drawingCount = await prisma.drawing.count({
      where: { projectId: project.id }
    });
    console.log(`\n📐 Total drawings: ${drawingCount}`);

    // Check milestone counts
    const milestoneCount = await prisma.componentMilestone.count({
      where: {
        component: {
          projectId: project.id
        }
      }
    });
    console.log(`🎯 Total milestones: ${milestoneCount}`);

    console.log("\n✅ PipeTrak API test completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Start the dev server: pnpm dev");
    console.log(`   2. Navigate to: http://localhost:3000/app/pipetrak/${project.id}/components`);
    console.log(`   3. The enhanced DataTable should display the ${componentCount} components`);

  } catch (error) {
    console.error("❌ Error testing PipeTrak API:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPipeTrakAPI().catch(console.error);