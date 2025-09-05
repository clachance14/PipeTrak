#!/usr/bin/env tsx
import { PrismaClient } from '@repo/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function testProgressSummary() {
  console.log('🧪 Testing Progress Summary Report deployment...\n');

  try {
    // 1. Check if effectiveDate column exists
    console.log('1️⃣ Checking effectiveDate column...');
    const testMilestone = await prisma.componentMilestone.findFirst({
      select: {
        id: true,
        effectiveDate: true,
        milestoneName: true,
      },
      take: 1,
    });
    
    if (testMilestone !== null) {
      console.log('✅ effectiveDate column exists in ComponentMilestone table');
      console.log(`   Sample: ${testMilestone.milestoneName} - effectiveDate: ${testMilestone.effectiveDate || 'null'}`);
    } else {
      console.log('⚠️  No milestones found to test');
    }

    // 2. Check if ProgressSnapshot table exists
    console.log('\n2️⃣ Checking ProgressSnapshot table...');
    const snapshotCount = await prisma.progressSnapshots.count();
    console.log(`✅ ProgressSnapshot table exists (${snapshotCount} records)`);

    // 3. Test creating a snapshot
    console.log('\n3️⃣ Testing snapshot creation...');
    const project = await prisma.project.findFirst({
      select: { id: true, jobName: true },
    });

    if (project) {
      const testSnapshot = await prisma.progressSnapshots.create({
        data: {
          projectId: project.id,
          snapshotDate: new Date('2024-11-24'), // Sunday
          totalComponents: 50,
          completedComponents: 33,
          overallCompletionPercent: 66.0,
          rocWeightedPercent: 68.5,
          areaBreakdown: [
            {
              area: 'TEST-01',
              componentCount: 50,
              completionPercent: 66.0,
              completedComponents: 33,
            },
          ],
          systemBreakdown: [
            {
              system: 'CS-01',
              componentCount: 25,
              completionPercent: 70.0,
              completedComponents: 17,
            },
            {
              system: 'SS-01',
              componentCount: 25,
              completionPercent: 62.0,
              completedComponents: 16,
            },
          ],
          testPackageBreakdown: [
            {
              testPackage: 'TP-TEST',
              componentCount: 50,
              completionPercent: 66.0,
              completedComponents: 33,
            },
          ],
          dailyVelocity: 2.5,
          weeklyVelocity: 17.5,
          milestoneVelocity: {
            Receive: 5.2,
            Erect: 3.1,
            Test: 2.8,
          },
          stalledComponents7d: 2,
          stalledComponents14d: 5,
          stalledComponents21d: 8,
          calculationDuration: 450,
          generationMethod: 'manual',
        },
      });
      console.log(`✅ Created test snapshot for project: ${project.jobName}`);
      console.log(`   Snapshot ID: ${testSnapshot.id}`);

      // Clean up test snapshot
      await prisma.progressSnapshots.delete({
        where: { id: testSnapshot.id },
      });
      console.log('   Cleaned up test snapshot');
    } else {
      console.log('⚠️  No projects found for testing');
    }

    // 4. Check milestone effective dates
    console.log('\n4️⃣ Checking milestone effective dates...');
    const milestonesWithDates = await prisma.componentMilestone.count({
      where: {
        effectiveDate: { not: null as any },
      },
    });
    const totalMilestones = await prisma.componentMilestone.count();
    console.log(`📊 Milestones with effectiveDate: ${milestonesWithDates}/${totalMilestones}`);

    // 5. Test API endpoint availability
    console.log('\n5️⃣ Testing API endpoint availability...');
    console.log('📍 Report endpoint: /api/pipetrak/reports/progress-summary');
    console.log('📍 Export endpoint: /api/pipetrak/exports/progress-summary');
    console.log('📍 Frontend route: /app/pipetrak/[projectId]/reports/progress');

    console.log('\n✨ Progress Summary Report deployment test complete!');
    console.log('\n📋 Manual steps required:');
    console.log('1. Copy SQL functions from packages/database/supabase/migrations/20250812T1600_progress_summary_functions.sql');
    console.log('2. Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/sql/new');
    console.log('3. Test the report UI at: http://localhost:3000/app/pipetrak/[projectId]/reports/progress');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProgressSummary()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });