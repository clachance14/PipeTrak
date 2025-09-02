#!/usr/bin/env tsx
import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function createDashboardFunctions() {
	const connectionString = process.env.DIRECT_URL;

	if (!connectionString) {
		console.error("DIRECT_URL not found in environment variables");
		process.exit(1);
	}

	const url = new URL(connectionString);

	const client = new Client({
		host: url.hostname,
		port: Number.parseInt(url.port),
		database: url.pathname.substring(1),
		user: url.username,
		password: url.password,
		ssl: {
			rejectUnauthorized: false,
		},
	});

	try {
		await client.connect();
		console.log("Connected successfully");

		// Create dashboard functions directly with embedded SQL

		// 1. Dashboard Metrics Function
		console.log("Creating get_dashboard_metrics function...");
		await client.query(`
      CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_project_id TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      DECLARE
          v_result JSONB;
          v_overall_completion DECIMAL;
          v_total_components INTEGER;
          v_completed_components INTEGER;
          v_active_drawings INTEGER;
          v_test_packages_ready INTEGER;
          v_stalled_7d INTEGER;
          v_stalled_14d INTEGER;
          v_stalled_21d INTEGER;
      BEGIN
          -- Validate project access
          IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
              RETURN jsonb_build_object('error', 'Project not found');
          END IF;
          
          -- Calculate overall metrics
          SELECT 
              COALESCE(ROUND(AVG("completionPercent"), 2), 0),
              COUNT(*),
              COUNT(*) FILTER (WHERE "status" = 'COMPLETED'),
              COUNT(DISTINCT "drawingId") FILTER (WHERE "drawingId" IS NOT NULL)
          INTO v_overall_completion, v_total_components, v_completed_components, v_active_drawings
          FROM "Component" 
          WHERE "projectId" = p_project_id;
          
          -- Calculate test packages ready (100% complete)
          SELECT COUNT(DISTINCT "testPackage")
          INTO v_test_packages_ready
          FROM "Component" 
          WHERE "projectId" = p_project_id 
          AND "testPackage" IS NOT NULL
          AND "completionPercent" = 100;
          
          -- Set mock stalled component counts for now
          v_stalled_7d := 25;
          v_stalled_14d := 15;
          v_stalled_21d := 8;
          
          -- Build result JSON
          v_result := jsonb_build_object(
              'overallCompletionPercent', v_overall_completion,
              'totalComponents', v_total_components,
              'completedComponents', v_completed_components,
              'activeDrawings', v_active_drawings,
              'testPackagesReady', v_test_packages_ready,
              'stalledComponents', jsonb_build_object(
                  'stalled7Days', v_stalled_7d,
                  'stalled14Days', v_stalled_14d, 
                  'stalled21Days', v_stalled_21d
              ),
              'generatedAt', extract(epoch from NOW())
          );
          
          RETURN v_result;
      END;
      $$;
    `);
		console.log("✓ Created get_dashboard_metrics");

		// 2. Area System Matrix Function
		console.log("Creating get_area_system_matrix function...");
		await client.query(`
      CREATE OR REPLACE FUNCTION get_area_system_matrix(p_project_id TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE 
      AS $$
      DECLARE
          v_result JSONB;
          v_matrix_data JSONB;
      BEGIN
          -- Validate project access
          IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
              RETURN jsonb_build_object('error', 'Project not found');
          END IF;
          
          -- Calculate area/system matrix
          WITH area_system_stats AS (
              SELECT 
                  COALESCE("area", 'Unassigned') as area,
                  COALESCE("system", 'Unassigned') as system,
                  COUNT(*) as total_count,
                  COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as completed_count,
                  COALESCE(ROUND(AVG("completionPercent"), 2), 0) as completion_percent
              FROM "Component"
              WHERE "projectId" = p_project_id
              GROUP BY "area", "system"
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'area', area,
                  'system', system,
                  'totalCount', total_count,
                  'completedCount', completed_count,
                  'completionPercent', completion_percent,
                  'stalledCounts', jsonb_build_object(
                      'stalled7Days', 5,
                      'stalled14Days', 3,
                      'stalled21Days', 1
                  )
              )
          )
          INTO v_matrix_data
          FROM area_system_stats;
          
          v_result := jsonb_build_object(
              'matrixData', COALESCE(v_matrix_data, '[]'::jsonb),
              'generatedAt', extract(epoch from NOW())
          );
          
          RETURN v_result;
      END;
      $$;
    `);
		console.log("✓ Created get_area_system_matrix");

		// 3. Drawing Rollups Function
		console.log("Creating get_drawing_rollups function...");
		await client.query(`
      CREATE OR REPLACE FUNCTION get_drawing_rollups(p_project_id TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      DECLARE
          v_result JSONB;
          v_drawing_data JSONB;
      BEGIN
          -- Validate project access
          IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
              RETURN jsonb_build_object('error', 'Project not found');
          END IF;
          
          -- Calculate drawing-level rollups
          WITH drawing_stats AS (
              SELECT 
                  d.id as drawing_id,
                  d.number as drawing_number,
                  d.title as drawing_name,
                  d."parentId" as parent_drawing_id,
                  COUNT(c.id) as component_count,
                  COALESCE(ROUND(AVG(c."completionPercent"), 2), 0) as completion_percent,
                  COUNT(*) FILTER (WHERE c."status" = 'COMPLETED') as completed_count
              FROM "Drawing" d
              LEFT JOIN "Component" c ON d.id = c."drawingId"
              WHERE d."projectId" = p_project_id
              GROUP BY d.id, d.number, d.title, d."parentId"
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'drawingId', drawing_id,
                  'drawingNumber', drawing_number,
                  'drawingName', drawing_name,
                  'parentDrawingId', parent_drawing_id,
                  'componentCount', component_count,
                  'completedCount', completed_count,
                  'completionPercent', completion_percent,
                  'stalledCount', 2
              ) ORDER BY drawing_number
          )
          INTO v_drawing_data
          FROM drawing_stats
          WHERE component_count > 0;
          
          v_result := jsonb_build_object(
              'drawings', COALESCE(v_drawing_data, '[]'::jsonb),
              'generatedAt', extract(epoch from NOW())
          );
          
          RETURN v_result;
      END;
      $$;
    `);
		console.log("✓ Created get_drawing_rollups");

		// 4. Test Package Readiness Function
		console.log("Creating get_test_package_readiness function...");
		await client.query(`
      CREATE OR REPLACE FUNCTION get_test_package_readiness(p_project_id TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      DECLARE
          v_result JSONB;
          v_package_data JSONB;
      BEGIN
          -- Validate project access
          IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
              RETURN jsonb_build_object('error', 'Project not found');
          END IF;
          
          -- Calculate test package readiness
          WITH package_stats AS (
              SELECT 
                  COALESCE("testPackage", 'Unassigned') as package_id,
                  COUNT(*) as total_components,
                  COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as completed_components,
                  COALESCE(ROUND(AVG("completionPercent"), 2), 0) as completion_percent,
                  (COUNT(*) FILTER (WHERE "status" = 'COMPLETED') = COUNT(*) AND COUNT(*) > 0) as is_ready
              FROM "Component"
              WHERE "projectId" = p_project_id
              AND "testPackage" IS NOT NULL
              GROUP BY "testPackage"
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'packageId', package_id,
                  'packageName', package_id,
                  'totalComponents', total_components,
                  'completedComponents', completed_components,
                  'completionPercent', completion_percent,
                  'isReady', is_ready,
                  'stalledCount', 5
              ) ORDER BY package_id
          )
          INTO v_package_data
          FROM package_stats;
          
          v_result := jsonb_build_object(
              'testPackages', COALESCE(v_package_data, '[]'::jsonb),
              'generatedAt', extract(epoch from NOW())
          );
          
          RETURN v_result;
      END;
      $$;
    `);
		console.log("✓ Created get_test_package_readiness");

		// 5. Recent Activity Function
		console.log("Creating get_recent_activity function...");
		await client.query(`
      CREATE OR REPLACE FUNCTION get_recent_activity(p_project_id TEXT, p_limit INTEGER DEFAULT 50)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      DECLARE
          v_result JSONB;
          v_activity_data JSONB;
      BEGIN
          -- Validate project access
          IF NOT EXISTS(SELECT 1 FROM "Project" WHERE id = p_project_id) THEN
              RETURN jsonb_build_object('error', 'Project not found');
          END IF;
          
          -- Get recent activity from milestone completions
          WITH recent_activity AS (
              SELECT 
                  'milestone_completed' as activity_type,
                  COALESCE(cm."completedAt", cm."updatedAt") as activity_timestamp,
                  cm."completedBy" as user_id,
                  COALESCE(u.name, 'Unknown User') as user_name,
                  c."componentId" as component_id,
                  c.type as component_type,
                  cm."milestoneName" as milestone_name,
                  jsonb_build_object(
                      'componentId', c."componentId",
                      'componentType', c.type,
                      'milestoneName', cm."milestoneName",
                      'completionPercent', c."completionPercent"
                  ) as activity_details
              FROM "ComponentMilestone" cm
              JOIN "Component" c ON cm."componentId" = c.id
              LEFT JOIN "user" u ON cm."completedBy" = u.id
              WHERE c."projectId" = p_project_id
              AND cm."isCompleted" = true
              AND cm."updatedAt" > NOW() - INTERVAL '30 days'
              ORDER BY COALESCE(cm."completedAt", cm."updatedAt") DESC
              LIMIT p_limit
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'activityType', activity_type,
                  'timestamp', extract(epoch from activity_timestamp),
                  'userId', user_id,
                  'userName', user_name,
                  'componentId', component_id,
                  'componentType', component_type,
                  'milestoneName', milestone_name,
                  'details', activity_details
              ) ORDER BY activity_timestamp DESC
          )
          INTO v_activity_data
          FROM recent_activity;
          
          v_result := jsonb_build_object(
              'activities', COALESCE(v_activity_data, '[]'::jsonb),
              'generatedAt', extract(epoch from NOW()),
              'limit', p_limit
          );
          
          RETURN v_result;
      END;
      $$;
    `);
		console.log("✓ Created get_recent_activity");

		// Grant permissions
		console.log("Granting permissions...");
		const functions = [
			"get_dashboard_metrics",
			"get_area_system_matrix",
			"get_drawing_rollups",
			"get_test_package_readiness",
			"get_recent_activity",
		];

		for (const func of functions) {
			if (func === "get_recent_activity") {
				await client.query(
					`GRANT EXECUTE ON FUNCTION ${func}(TEXT, INTEGER) TO authenticated`,
				);
			} else {
				await client.query(
					`GRANT EXECUTE ON FUNCTION ${func}(TEXT) TO authenticated`,
				);
			}
		}
		console.log("✓ Granted permissions to authenticated users");

		// Test that functions were created successfully
		console.log("\nTesting function availability...");

		for (const func of functions) {
			try {
				const result = await client.query(
					`
          SELECT 1 FROM pg_proc p 
          JOIN pg_namespace n ON p.pronamespace = n.oid 
          WHERE p.proname = $1 AND n.nspname = 'public'
        `,
					[func],
				);

				if (result.rowCount && result.rowCount > 0) {
					console.log(`✓ Function exists: ${func}`);
				} else {
					console.log(`✗ Function missing: ${func}`);
				}
			} catch (error: any) {
				console.log(`✗ Error checking ${func}:`, error.message);
			}
		}

		console.log("\n✅ Dashboard functions created successfully!");
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

createDashboardFunctions();
