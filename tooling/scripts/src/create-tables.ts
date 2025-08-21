#!/usr/bin/env tsx
import { PrismaClient } from "@repo/database/client";

const prisma = new PrismaClient();

async function createTables() {
  console.log("Creating PipeTrak tables...");
  
  try {
    // Try to create tables using raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Drawing" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "projectId" TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
        number TEXT NOT NULL,
        title TEXT NOT NULL,
        revision TEXT,
        "parentDrawingId" TEXT,
        metadata JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created Drawing table");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MilestoneTemplate" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "projectId" TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        milestones JSONB NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created MilestoneTemplate table");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Component" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "projectId" TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
        "componentId" TEXT NOT NULL,
        type TEXT NOT NULL,
        "workflowType" TEXT NOT NULL DEFAULT 'MILESTONE_DISCRETE',
        spec TEXT,
        size TEXT,
        material TEXT,
        area TEXT,
        system TEXT,
        "testPackage" TEXT,
        location TEXT,
        "parentComponentId" TEXT,
        "drawingId" TEXT,
        "milestoneTemplateId" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NOT_STARTED',
        "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        metadata JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created Component table");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ComponentMilestone" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "componentId" TEXT NOT NULL,
        "milestoneName" TEXT NOT NULL,
        "milestoneOrder" INTEGER NOT NULL,
        weight DOUBLE PRECISION NOT NULL DEFAULT 0,
        "isCompleted" BOOLEAN NOT NULL DEFAULT false,
        "percentageValue" DOUBLE PRECISION,
        "quantityValue" DOUBLE PRECISION,
        "quantityUnit" TEXT,
        "completedAt" TIMESTAMP(3),
        "completedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("componentId", "milestoneName")
      )
    `);
    console.log("✓ Created ComponentMilestone table");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ImportJob" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "projectId" TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        "originalPath" TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "totalRows" INTEGER,
        "processedRows" INTEGER,
        "errorRows" INTEGER,
        errors JSONB,
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created ImportJob table");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "projectId" TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        changes JSONB NOT NULL,
        metadata JSONB,
        "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Created AuditLog table");

    // Add foreign key constraints after all tables are created
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Drawing" 
      ADD CONSTRAINT IF NOT EXISTS fk_drawing_parent 
      FOREIGN KEY ("parentDrawingId") REFERENCES "Drawing"(id) ON DELETE SET NULL
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Component" 
      ADD CONSTRAINT IF NOT EXISTS fk_component_drawing 
      FOREIGN KEY ("drawingId") REFERENCES "Drawing"(id) ON DELETE SET NULL
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Component" 
      ADD CONSTRAINT IF NOT EXISTS fk_component_milestone_template 
      FOREIGN KEY ("milestoneTemplateId") REFERENCES "MilestoneTemplate"(id)
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Component" 
      ADD CONSTRAINT IF NOT EXISTS fk_component_parent 
      FOREIGN KEY ("parentComponentId") REFERENCES "Component"(id) ON DELETE SET NULL
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ComponentMilestone" 
      ADD CONSTRAINT IF NOT EXISTS fk_milestone_component 
      FOREIGN KEY ("componentId") REFERENCES "Component"(id) ON DELETE CASCADE
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ComponentMilestone" 
      ADD CONSTRAINT IF NOT EXISTS fk_milestone_completer 
      FOREIGN KEY ("completedBy") REFERENCES "user"(id) ON DELETE SET NULL
    `).catch(() => {});

    console.log("\n✅ All PipeTrak tables created successfully!");
    
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();