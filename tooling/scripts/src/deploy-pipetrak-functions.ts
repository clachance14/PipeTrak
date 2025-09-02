import { Client } from "pg";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const SQL_FUNCTIONS = `
-- Drop existing functions to avoid parameter conflicts
DROP FUNCTION IF EXISTS calculate_component_completion(text) CASCADE;
DROP FUNCTION IF EXISTS update_component_milestone(text, text, boolean, numeric, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS bulk_update_milestones(json[]) CASCADE;
DROP FUNCTION IF EXISTS get_project_progress(text) CASCADE;
DROP FUNCTION IF EXISTS initialize_component_milestones(text) CASCADE;
DROP FUNCTION IF EXISTS process_import_job(text) CASCADE;
DROP FUNCTION IF EXISTS trigger_initialize_milestones() CASCADE;

-- Function to calculate component completion based on milestone weights
CREATE OR REPLACE FUNCTION calculate_component_completion(p_component_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workflow_type text;
  v_completion numeric;
  v_total_weight numeric;
  v_weighted_completion numeric;
BEGIN
  -- Get the workflow type for this component
  SELECT c."workflowType" INTO v_workflow_type
  FROM "Component" c
  WHERE c.id = p_component_id;

  IF v_workflow_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate based on workflow type
  IF v_workflow_type = 'MILESTONE_DISCRETE' THEN
    -- For discrete milestones, calculate based on completed milestones with weights
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN cm."isCompleted" THEN cm.weight
          ELSE 0 
        END
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = p_component_id;

    v_completion := (v_weighted_completion / NULLIF(v_total_weight, 0)) * 100;

  ELSIF v_workflow_type = 'MILESTONE_PERCENTAGE' THEN
    -- For percentage milestones, average the percentages with weights
    SELECT 
      COALESCE(SUM(
        COALESCE(cm."percentageValue", 0) * cm.weight
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = p_component_id;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSIF v_workflow_type = 'MILESTONE_QUANTITY' THEN
    -- For quantity milestones, calculate based on quantities completed
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN cm."quantityValue" IS NOT NULL AND c."totalQuantity" > 0 THEN
            (cm."quantityValue" / c."totalQuantity") * cm.weight * 100
          ELSE 0
        END
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    WHERE cm."componentId" = p_component_id;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSE
    v_completion := 0;
  END IF;

  -- Ensure completion is between 0 and 100
  v_completion := LEAST(GREATEST(v_completion, 0), 100);

  -- Update the component's completion percentage and status
  UPDATE "Component" 
  SET "completionPercent" = v_completion,
      status = CASE 
        WHEN v_completion = 0 THEN 'NOT_STARTED'::"ComponentStatus"
        WHEN v_completion < 100 THEN 'IN_PROGRESS'::"ComponentStatus"
        ELSE 'COMPLETED'::"ComponentStatus"
      END,
      "updatedAt" = NOW()
  WHERE id = p_component_id;

  RETURN v_completion;
END;
$$;

-- Function to get project progress summary
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result json;
BEGIN
  WITH component_stats AS (
    SELECT 
      COUNT(*) as total_components,
      COUNT(*) FILTER (WHERE status = 'NOT_STARTED') as not_started,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
      AVG("completionPercent") as avg_completion,
      COUNT(DISTINCT area) as areas,
      COUNT(DISTINCT system) as systems,
      COUNT(DISTINCT "testPackage") as test_packages
    FROM "Component"
    WHERE "projectId" = p_project_id
  ),
  area_progress AS (
    SELECT 
      area,
      COUNT(*) as component_count,
      AVG("completionPercent") as avg_completion
    FROM "Component"
    WHERE "projectId" = p_project_id
    AND area IS NOT NULL
    GROUP BY area
  ),
  system_progress AS (
    SELECT 
      system,
      COUNT(*) as component_count,
      AVG("completionPercent") as avg_completion
    FROM "Component"
    WHERE "projectId" = p_project_id
    AND system IS NOT NULL
    GROUP BY system
  ),
  recent_updates AS (
    SELECT 
      json_agg(
        json_build_object(
          'componentId', c."componentId",
          'displayId', c."displayId",
          'action', 'milestone_update',
          'timestamp', cm."completedAt",
          'milestone', cm."milestoneName",
          'user', u.name
        ) ORDER BY cm."completedAt" DESC
      ) as updates
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    LEFT JOIN "user" u ON cm."completedBy" = u.id
    WHERE c."projectId" = p_project_id
    AND cm."completedAt" IS NOT NULL
    AND cm."completedAt" > NOW() - INTERVAL '7 days'
    LIMIT 20
  )
  SELECT json_build_object(
    'overall', (SELECT row_to_json(component_stats) FROM component_stats),
    'byArea', (SELECT json_agg(row_to_json(area_progress)) FROM area_progress),
    'bySystem', (SELECT json_agg(row_to_json(system_progress)) FROM system_progress),
    'recentUpdates', (SELECT updates FROM recent_updates)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_component_completion TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_progress TO authenticated;

-- Add comment documentation
COMMENT ON FUNCTION calculate_component_completion IS 'Calculates and updates the completion percentage for a component based on its milestones and workflow type';
COMMENT ON FUNCTION get_project_progress IS 'Returns comprehensive progress statistics for a project';
`;

async function deployFunctions() {
	console.log("🚀 Deploying PipeTrak Supabase functions...\n");

	if (!process.env.DIRECT_URL) {
		throw new Error("DIRECT_URL environment variable is not set");
	}

	// Parse connection string and add SSL config
	const connectionConfig: any = {
		connectionString: process.env.DIRECT_URL,
	};

	// For Supabase, we need to handle SSL properly
	if (process.env.DIRECT_URL?.includes("supabase")) {
		connectionConfig.ssl = {
			rejectUnauthorized: false,
			ca: undefined,
		};
	}

	const client = new Client(connectionConfig);

	try {
		await client.connect();
		console.log("✅ Connected to database\n");

		console.log("📝 Deploying functions...");
		await client.query(SQL_FUNCTIONS);
		console.log("✅ Functions deployed successfully\n");

		// Test the functions
		console.log("🧪 Testing functions...\n");

		// Test get_project_progress with the SDO Tank project
		try {
			const projectResult = await client.query(`
        SELECT id FROM "Project" WHERE name = 'SDO Tank' LIMIT 1
      `);

			if (projectResult.rows[0]) {
				const projectId = projectResult.rows[0].id;
				const result = await client.query(
					`
          SELECT get_project_progress($1) as progress
        `,
					[projectId],
				);

				if (result.rows[0]?.progress) {
					const progress = result.rows[0].progress;
					console.log("✅ get_project_progress works");
					console.log(
						`   - Total components: ${progress.overall?.total_components || 0}`,
					);
					console.log(
						`   - Not started: ${progress.overall?.not_started || 0}`,
					);
					console.log(
						`   - In progress: ${progress.overall?.in_progress || 0}`,
					);
					console.log(
						`   - Completed: ${progress.overall?.completed || 0}`,
					);
					console.log(
						`   - Average completion: ${Math.round(progress.overall?.avg_completion || 0)}%\n`,
					);
				}
			}
		} catch (error: any) {
			console.error("❌ get_project_progress failed:", error.message);
		}

		// Test calculate_component_completion
		try {
			// Get a sample component ID
			const componentResult = await client.query(`
        SELECT id, "componentId", "displayId" FROM "Component" LIMIT 1
      `);

			if (componentResult.rows[0]) {
				const component = componentResult.rows[0];
				const result = await client.query(
					`
          SELECT calculate_component_completion($1) as completion
        `,
					[component.id],
				);

				console.log("✅ calculate_component_completion works");
				console.log(
					`   - Component: ${component.displayId || component.componentId}`,
				);
				console.log(
					`   - Completion: ${Math.round(result.rows[0].completion || 0)}%\n`,
				);

				// Check if the component status was updated
				const statusResult = await client.query(
					`
          SELECT status, "completionPercent" FROM "Component" WHERE id = $1
        `,
					[component.id],
				);

				if (statusResult.rows[0]) {
					console.log("✅ Component status updated");
					console.log(`   - Status: ${statusResult.rows[0].status}`);
					console.log(
						`   - Completion: ${statusResult.rows[0].completionPercent}%\n`,
					);
				}
			}
		} catch (error: any) {
			console.error(
				"❌ calculate_component_completion failed:",
				error.message,
			);
		}

		console.log("✅ Deployment complete!");
	} catch (error) {
		console.error("❌ Error during deployment:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run deployment
deployFunctions()
	.then(() => {
		console.log("\n🎉 Success! Core Supabase functions are ready to use.");
		console.log("\nDeployed functions:");
		console.log("  - calculate_component_completion(component_id)");
		console.log("  - get_project_progress(project_id)");
		console.log(
			"\nYou can now use these functions from the API endpoints.",
		);
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Deployment failed:", error.message);
		process.exit(1);
	});
