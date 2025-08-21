import { Client } from 'pg';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function debugMilestoneData() {
  console.log('🔍 Debugging Milestone Data...\n');
  
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is not set');
  }

  // Parse connection string and add SSL config
  const connectionConfig: any = {
    connectionString: process.env.DIRECT_URL,
  };

  // For Supabase, we need to handle SSL properly
  if (process.env.DIRECT_URL?.includes('supabase')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false,
      ca: undefined
    };
  }

  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    
    // Get a sample project ID
    const projectResult = await client.query(`
      SELECT id, "jobName" FROM "Project" LIMIT 1
    `);
    
    if (projectResult.rows.length === 0) {
      console.log('No projects found');
      return;
    }
    
    const projectId = projectResult.rows[0].id;
    const projectName = projectResult.rows[0].jobName;
    console.log(`📊 Analyzing project: ${projectName} (${projectId})\n`);
    
    // 1. Check milestone statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_milestones,
        COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) as completed_milestones,
        COUNT(CASE WHEN cm."percentageValue" IS NOT NULL THEN 1 END) as has_percentage,
        COUNT(CASE WHEN cm."effectiveDate" IS NOT NULL THEN 1 END) as has_effective_date,
        COUNT(DISTINCT cm."componentId") as unique_components,
        COUNT(DISTINCT cm."milestoneName") as unique_milestone_types
      FROM "ComponentMilestone" cm
      JOIN "Component" c ON cm."componentId" = c.id
      WHERE c."projectId" = $1
    `, [projectId]);
    
    console.log('📈 Milestone Statistics:');
    console.log('Total milestones:', statsResult.rows[0].total_milestones);
    console.log('Completed milestones:', statsResult.rows[0].completed_milestones);
    console.log('Has percentage value:', statsResult.rows[0].has_percentage);
    console.log('Has effective date:', statsResult.rows[0].has_effective_date);
    console.log('Unique components:', statsResult.rows[0].unique_components);
    console.log('Unique milestone types:', statsResult.rows[0].unique_milestone_types);
    console.log();
    
    // 2. Check milestone types
    const typesResult = await client.query(`
      SELECT 
        "milestoneName",
        COUNT(*) as count,
        COUNT(CASE WHEN "isCompleted" = true THEN 1 END) as completed,
        AVG(CASE WHEN "percentageValue" IS NOT NULL THEN "percentageValue" ELSE 0 END) as avg_percentage
      FROM "ComponentMilestone" cm
      JOIN "Component" c ON cm."componentId" = c.id
      WHERE c."projectId" = $1
      GROUP BY "milestoneName"
      ORDER BY "milestoneName"
    `, [projectId]);
    
    console.log('📋 Milestone Types:');
    typesResult.rows.forEach(row => {
      console.log(`  ${row.milestoneName}: ${row.completed}/${row.count} completed (${Math.round(row.avg_percentage)}% avg)`);
    });
    console.log();
    
    // 3. Check area progress
    const areaResult = await client.query(`
      SELECT 
        c.area,
        COUNT(DISTINCT c.id) as component_count,
        COUNT(cm.id) as milestone_count,
        COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) as completed_milestones,
        ROUND(100.0 * COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) / NULLIF(COUNT(cm.id), 0), 2) as completion_percent
      FROM "Component" c
      LEFT JOIN "ComponentMilestone" cm ON cm."componentId" = c.id
      WHERE c."projectId" = $1 AND c.area IS NOT NULL
      GROUP BY c.area
      ORDER BY c.area
      LIMIT 10
    `, [projectId]);
    
    console.log('🏗️ Area Progress:');
    areaResult.rows.forEach(row => {
      console.log(`  ${row.area}: ${row.completed_milestones}/${row.milestone_count} milestones (${row.completion_percent}%)`);
    });
    console.log();
    
    // 4. Sample milestone data
    const sampleResult = await client.query(`
      SELECT 
        c."componentId",
        c.area,
        c.system,
        cm."milestoneName",
        cm."isCompleted",
        cm."percentageValue",
        cm."effectiveDate"
      FROM "ComponentMilestone" cm
      JOIN "Component" c ON cm."componentId" = c.id
      WHERE c."projectId" = $1
      LIMIT 10
    `, [projectId]);
    
    console.log('📝 Sample Milestone Data:');
    sampleResult.rows.forEach(row => {
      console.log(`  Component: ${row.componentId}`);
      console.log(`    Area: ${row.area}, System: ${row.system}`);
      console.log(`    Milestone: ${row.milestoneName}`);
      console.log(`    Completed: ${row.isCompleted}, Percentage: ${row.percentageValue}%`);
      console.log(`    Effective Date: ${row.effectiveDate || 'NULL'}`);
      console.log();
    });
    
    // 5. Check for missing milestone relationships
    const missingResult = await client.query(`
      SELECT COUNT(*) as components_without_milestones
      FROM "Component" c
      WHERE c."projectId" = $1
      AND NOT EXISTS (
        SELECT 1 FROM "ComponentMilestone" cm 
        WHERE cm."componentId" = c.id
      )
    `, [projectId]);
    
    console.log('⚠️ Data Issues:');
    console.log('Components without milestones:', missingResult.rows[0].components_without_milestones);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugMilestoneData().catch(console.error);