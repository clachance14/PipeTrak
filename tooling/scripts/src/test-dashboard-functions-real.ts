#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Parse .env file manually
async function loadEnv() {
  const envPath = path.join(__dirname, '../../../.env');
  const envContent = await fs.readFile(envPath, 'utf8');
  const env: Record<string, string> = {};

  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
        env[key] = value;
      }
    }
  });

  return env;
}

async function testWithRealData() {
  console.log('🧪 Testing dashboard functions with real data...');

  try {
    const env = await loadEnv();
    const directUrl = env.DIRECT_URL;
    if (!directUrl) {
      throw new Error('DIRECT_URL not found in environment');
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const pool = new Pool({
      connectionString: directUrl,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
      // Find a real project ID
      console.log('📊 Finding available projects...');
      const projectsResult = await client.query('SELECT id, "jobName", "organizationId" FROM "Project" LIMIT 5');
      
      if (projectsResult.rows.length === 0) {
        console.log('⚠️  No projects found in database');
        return;
      }

      console.log(`Found ${projectsResult.rows.length} project(s):`);
      projectsResult.rows.forEach(p => {
        console.log(`  - ${p.id}: ${p.jobName} (Org: ${p.organizationId})`);
      });

      const testProjectId = projectsResult.rows[0].id;
      console.log(`\n🎯 Testing with project: ${testProjectId} (${projectsResult.rows[0].jobName})`);

      // Test each function with real project ID
      const functions = [
        'get_dashboard_metrics',
        'get_area_system_matrix', 
        'get_drawing_rollups',
        'get_test_package_readiness',
        'get_recent_activity'
      ];

      for (const funcName of functions) {
        try {
          console.log(`\n🔧 Testing ${funcName}...`);
          
          const params = funcName === 'get_recent_activity' 
            ? [testProjectId, '10']
            : [testProjectId];
          
          const paramStr = params.map(p => `'${p}'`).join(', ');
          const result = await client.query(`SELECT ${funcName}(${paramStr}) as result`);
          
          const data = result.rows[0]?.result;
          if (data) {
            if (data.error) {
              console.log(`❌ ${funcName}: ${data.error}`);
            } else {
              // Pretty print sample of the returned data
              console.log(`✅ ${funcName}: SUCCESS`);
              
              if (funcName === 'get_dashboard_metrics') {
                console.log(`   - Overall completion: ${data.overallCompletionPercent}%`);
                console.log(`   - Total components: ${data.totalComponents}`);
                console.log(`   - Completed components: ${data.completedComponents}`);
                console.log(`   - Active drawings: ${data.activeDrawings}`);
              } else if (funcName === 'get_area_system_matrix') {
                const matrixCount = data.matrixData?.length || 0;
                console.log(`   - Area/System combinations: ${matrixCount}`);
                if (matrixCount > 0) {
                  const sample = data.matrixData[0];
                  console.log(`   - Sample: ${sample.area} / ${sample.system} (${sample.completionPercent}%)`);
                }
              } else if (funcName === 'get_drawing_rollups') {
                const drawingCount = data.drawings?.length || 0;
                console.log(`   - Drawings: ${drawingCount}`);
                if (drawingCount > 0) {
                  const sample = data.drawings[0];
                  console.log(`   - Sample: ${sample.drawingNumber} (${sample.completionPercent}%)`);
                }
              } else if (funcName === 'get_test_package_readiness') {
                const packageCount = data.testPackages?.length || 0;
                console.log(`   - Test packages: ${packageCount}`);
                if (packageCount > 0) {
                  const sample = data.testPackages[0];
                  console.log(`   - Sample: ${sample.packageName} (${sample.completionPercent}%)`);
                }
              } else if (funcName === 'get_recent_activity') {
                const activityCount = data.activities?.length || 0;
                console.log(`   - Recent activities: ${activityCount}`);
                if (activityCount > 0) {
                  const sample = data.activities[0];
                  console.log(`   - Latest: ${sample.activityType} on ${sample.componentId}`);
                }
              }
            }
          } else {
            console.log(`❌ ${funcName}: No data returned`);
          }
        } catch (err: any) {
          console.log(`❌ ${funcName}: ${err.message}`);
        }
      }
      
    } finally {
      client.release();
    }

    await pool.end();
    console.log('\n🎉 Testing completed!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWithRealData();