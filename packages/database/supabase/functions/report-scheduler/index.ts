// Report Scheduler Edge Function
// Handles automated report generation and progress snapshots on schedule

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface Database {
  public: {
    Tables: {
      ProgressSnapshots: {
        Row: {
          id: string;
          projectId: string;
          snapshotDate: string;
          snapshotTime: string;
          totalComponents: number;
          completedComponents: number;
          overallCompletionPercent: number;
          rocWeightedPercent: number;
          areaBreakdown: any;
          systemBreakdown: any;
          testPackageBreakdown: any;
          dailyVelocity: number | null;
          weeklyVelocity: number | null;
          milestoneVelocity: any | null;
          stalledComponents7d: number;
          stalledComponents14d: number;
          stalledComponents21d: number;
          calculationDuration: number | null;
          generatedBy: string | null;
          generationMethod: string;
        };
        Insert: {
          id?: string;
          projectId: string;
          snapshotDate: string;
          totalComponents: number;
          completedComponents: number;
          overallCompletionPercent: number;
          rocWeightedPercent: number;
          areaBreakdown: any;
          systemBreakdown: any;
          testPackageBreakdown: any;
          dailyVelocity?: number | null;
          weeklyVelocity?: number | null;
          milestoneVelocity?: any | null;
          stalledComponents7d?: number;
          stalledComponents14d?: number;
          stalledComponents21d?: number;
          calculationDuration?: number | null;
          generatedBy?: string | null;
          generationMethod?: string;
        };
      };
      Project: {
        Row: {
          id: string;
          organizationId: string;
          jobNumber: string;
          jobName: string;
          status: string;
        };
      };
      Component: {
        Row: {
          id: string;
          projectId: string;
          componentId: string;
          status: string;
          completionPercent: number;
          area: string | null;
          system: string | null;
          testPackage: string | null;
          type: string;
          updatedAt: string;
        };
      };
    };
  };
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "daily_snapshots";

    console.log(`Report scheduler triggered with action: ${action}`);

    switch (action) {
      case "daily_snapshots":
        return await generateDailySnapshots(supabase);
      
      case "weekly_reports":
        return await generateWeeklyReports(supabase);
      
      case "cleanup_expired":
        return await cleanupExpiredData(supabase);
      
      case "health_check":
        return await performHealthCheck(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("Report scheduler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateDailySnapshots(supabase: any) {
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`Generating daily snapshots for ${today}`);

  try {
    // Get all active projects
    const { data: projects, error: projectsError } = await supabase
      .from("Project")
      .select("id, organizationId, jobNumber, jobName")
      .neq("status", "ARCHIVED");

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    console.log(`Found ${projects.length} active projects`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process projects in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      const batchPromises = batch.map(project => generateProjectSnapshot(supabase, project, today));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          results.push({
            projectId: batch[index].id,
            status: "success",
            data: result.value,
          });
        } else {
          errorCount++;
          console.error(`Failed to generate snapshot for project ${batch[index].id}:`, result.reason);
          results.push({
            projectId: batch[index].id,
            status: "error",
            error: result.reason?.message || "Unknown error",
          });
        }
      });

      // Small delay between batches to be kind to the database
      if (i + batchSize < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`Daily snapshots completed: ${successCount} success, ${errorCount} errors, ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          action: "daily_snapshots",
          date: today,
          totalProjects: projects.length,
          successCount,
          errorCount,
          duration,
          results,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Daily snapshots error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate daily snapshots", 
        details: error.message,
        duration: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function generateProjectSnapshot(supabase: any, project: any, snapshotDate: string) {
  const snapshotStartTime = Date.now();
  
  console.log(`Generating snapshot for project ${project.id} (${project.jobNumber})`);

  try {
    // Check if snapshot already exists for today
    const { data: existingSnapshot, error: checkError } = await supabase
      .from("ProgressSnapshots")
      .select("id")
      .eq("projectId", project.id)
      .eq("snapshotDate", snapshotDate)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = not found
      throw checkError;
    }

    if (existingSnapshot) {
      console.log(`Snapshot already exists for project ${project.id} on ${snapshotDate}`);
      return { skipped: true, reason: "Already exists" };
    }

    // Get project components data
    const { data: components, error: componentsError } = await supabase
      .from("Component")
      .select(`
        id,
        status,
        completionPercent,
        area,
        system,
        testPackage,
        type,
        updatedAt
      `)
      .eq("projectId", project.id)
      .neq("status", "DELETED");

    if (componentsError) {
      throw new Error(`Failed to fetch components: ${componentsError.message}`);
    }

    if (components.length === 0) {
      console.log(`No components found for project ${project.id}, skipping snapshot`);
      return { skipped: true, reason: "No components" };
    }

    // Calculate basic metrics
    const totalComponents = components.length;
    const completedComponents = components.filter(c => c.status === "COMPLETED").length;
    const overallCompletionPercent = Math.round(
      (components.reduce((sum, c) => sum + c.completionPercent, 0) / totalComponents) * 100
    ) / 100;

    // Calculate ROC-weighted percentage (simplified - in production, use actual ROC weights)
    const rocWeightedPercent = overallCompletionPercent; // Placeholder

    // Generate area breakdown
    const areaBreakdown = generateBreakdown(components, "area");
    const systemBreakdown = generateBreakdown(components, "system");
    const testPackageBreakdown = generateBreakdown(components, "testPackage");

    // Calculate velocity metrics
    const velocityMetrics = await calculateVelocityMetrics(supabase, project.id);

    // Calculate stalled components
    const stalledMetrics = calculateStalledComponents(components);

    // Create snapshot record
    const snapshotData = {
      projectId: project.id,
      snapshotDate,
      totalComponents,
      completedComponents,
      overallCompletionPercent,
      rocWeightedPercent,
      areaBreakdown,
      systemBreakdown,
      testPackageBreakdown,
      dailyVelocity: velocityMetrics.dailyVelocity,
      weeklyVelocity: velocityMetrics.weeklyVelocity,
      milestoneVelocity: velocityMetrics.milestoneVelocity,
      stalledComponents7d: stalledMetrics.stalled7d,
      stalledComponents14d: stalledMetrics.stalled14d,
      stalledComponents21d: stalledMetrics.stalled21d,
      calculationDuration: Date.now() - snapshotStartTime,
      generationMethod: "scheduled",
    };

    const { data: newSnapshot, error: insertError } = await supabase
      .from("ProgressSnapshots")
      .insert(snapshotData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert snapshot: ${insertError.message}`);
    }

    // Send real-time notification
    await supabase.channel(`project:${project.id}:snapshots`).send({
      type: "broadcast",
      event: "snapshot_generated",
      payload: {
        snapshotId: newSnapshot.id,
        snapshotDate,
        completionPercent: overallCompletionPercent,
        totalComponents,
      },
    });

    console.log(`Snapshot generated for project ${project.id}: ${overallCompletionPercent}% complete`);

    return {
      snapshotId: newSnapshot.id,
      completionPercent: overallCompletionPercent,
      totalComponents,
      duration: Date.now() - snapshotStartTime,
    };

  } catch (error) {
    console.error(`Error generating snapshot for project ${project.id}:`, error);
    throw error;
  }
}

function generateBreakdown(components: any[], groupField: string): any[] {
  const groups = components.reduce((acc, component) => {
    const groupValue = component[groupField] || "Unassigned";
    if (!acc[groupValue]) {
      acc[groupValue] = [];
    }
    acc[groupValue].push(component);
    return acc;
  }, {});

  return Object.entries(groups).map(([groupName, groupComponents]: [string, any[]]) => ({
    [groupField]: groupName,
    componentCount: groupComponents.length,
    completedCount: groupComponents.filter(c => c.status === "COMPLETED").length,
    completionPercent: Math.round(
      (groupComponents.reduce((sum, c) => sum + c.completionPercent, 0) / groupComponents.length) * 100
    ) / 100,
  }));
}

async function calculateVelocityMetrics(supabase: any, projectId: string) {
  try {
    // Get milestone completions for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: milestones, error } = await supabase
      .rpc("get_recent_activity", {
        p_project_id: projectId,
        p_limit: 1000
      });

    if (error || !milestones?.activities) {
      console.log(`No milestone data available for velocity calculation: ${projectId}`);
      return {
        dailyVelocity: null,
        weeklyVelocity: null,
        milestoneVelocity: null,
      };
    }

    const recentCompletions = milestones.activities.filter((activity: any) => 
      activity.activityType === "milestone_completed" &&
      new Date(activity.timestamp * 1000) >= new Date(thirtyDaysAgo)
    );

    if (recentCompletions.length === 0) {
      return {
        dailyVelocity: 0,
        weeklyVelocity: 0,
        milestoneVelocity: {},
      };
    }

    // Calculate daily velocity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentWeekCompletions = recentCompletions.filter((activity: any) =>
      new Date(activity.timestamp * 1000) >= sevenDaysAgo
    );

    const dailyVelocity = Math.round((recentWeekCompletions.length / 7) * 100) / 100;
    const weeklyVelocity = recentWeekCompletions.length;

    // Calculate milestone-specific velocity
    const milestoneVelocity = recentWeekCompletions.reduce((acc: any, activity: any) => {
      const milestoneName = activity.milestoneName || "Unknown";
      acc[milestoneName] = (acc[milestoneName] || 0) + 1;
      return acc;
    }, {});

    // Convert to daily rates
    Object.keys(milestoneVelocity).forEach(milestone => {
      milestoneVelocity[milestone] = Math.round((milestoneVelocity[milestone] / 7) * 100) / 100;
    });

    return {
      dailyVelocity,
      weeklyVelocity,
      milestoneVelocity,
    };

  } catch (error) {
    console.error(`Velocity calculation error for project ${projectId}:`, error);
    return {
      dailyVelocity: null,
      weeklyVelocity: null,
      milestoneVelocity: null,
    };
  }
}

function calculateStalledComponents(components: any[]) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  let stalled7d = 0;
  let stalled14d = 0;
  let stalled21d = 0;

  components.forEach(component => {
    if (component.status === "COMPLETED" || component.status === "NOT_STARTED") {
      return; // Skip completed and not started components
    }

    const lastUpdated = new Date(component.updatedAt);
    
    if (lastUpdated < sevenDaysAgo) stalled7d++;
    if (lastUpdated < fourteenDaysAgo) stalled14d++;
    if (lastUpdated < twentyOneDaysAgo) stalled21d++;
  });

  return { stalled7d, stalled14d, stalled21d };
}

async function generateWeeklyReports(supabase: any) {
  console.log("Generating weekly reports");

  try {
    // Get organizations that have opted in for weekly reports
    const { data: projects, error } = await supabase
      .from("Project")
      .select("id, organizationId, jobNumber, jobName")
      .neq("status", "ARCHIVED");

    if (error) {
      throw error;
    }

    // For now, we'll just trigger weekly report generation
    // In a full implementation, this would generate and email comprehensive reports
    
    const results = [];
    for (const project of projects.slice(0, 5)) { // Limit for demo
      try {
        // Generate comprehensive report for each project
        const { data: report, error: reportError } = await supabase
          .rpc("generate_progress_report", {
            p_project_id: project.id,
            p_options: { includeTrends: true, includeVelocity: true }
          });

        if (reportError) {
          throw reportError;
        }

        results.push({
          projectId: project.id,
          jobNumber: project.jobNumber,
          status: "success",
          reportData: report,
        });

      } catch (error) {
        console.error(`Weekly report error for project ${project.id}:`, error);
        results.push({
          projectId: project.id,
          jobNumber: project.jobNumber,
          status: "error",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          action: "weekly_reports",
          processedProjects: results.length,
          successCount: results.filter(r => r.status === "success").length,
          errorCount: results.filter(r => r.status === "error").length,
          results,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Weekly reports error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate weekly reports", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function cleanupExpiredData(supabase: any) {
  console.log("Cleaning up expired data");

  try {
    const results = [];

    // Clean up expired report cache
    const { data: deletedCache, error: cacheError } = await supabase
      .rpc("cleanup_expired_cache");

    results.push({
      task: "cleanup_expired_cache",
      deletedCount: deletedCache || 0,
      success: !cacheError,
      error: cacheError?.message,
    });

    // Clean up old progress snapshots (keep last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const { data: deletedSnapshots, error: snapshotsError } = await supabase
      .from("ProgressSnapshots")
      .delete()
      .lt("snapshotDate", oneYearAgo.toISOString().split('T')[0]);

    results.push({
      task: "cleanup_old_snapshots",
      deletedCount: deletedSnapshots?.length || 0,
      success: !snapshotsError,
      error: snapshotsError?.message,
    });

    // Clean up completed report generations older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedReports, error: reportsError } = await supabase
      .from("ReportGenerations")
      .delete()
      .eq("status", "completed")
      .lt("completedAt", thirtyDaysAgo.toISOString());

    results.push({
      task: "cleanup_old_reports",
      deletedCount: deletedReports?.length || 0,
      success: !reportsError,
      error: reportsError?.message,
    });

    const totalDeleted = results.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
    const errorCount = results.filter(r => !r.success).length;

    console.log(`Cleanup completed: ${totalDeleted} records deleted, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          action: "cleanup_expired",
          totalDeleted,
          errorCount,
          results,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to cleanup expired data", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function performHealthCheck(supabase: any) {
  console.log("Performing health check");

  try {
    const checks = [];

    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from("Project")
      .select("id")
      .limit(1);

    checks.push({
      check: "database_connectivity",
      success: !dbError,
      details: dbError?.message || "Connected",
    });

    // Test RPC functions
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc("cleanup_expired_cache");

    checks.push({
      check: "rpc_functions",
      success: !rpcError,
      details: rpcError?.message || "RPC functions operational",
    });

    // Check storage bucket access
    const { data: storageTest, error: storageError } = await supabase.storage
      .from("reports")
      .list("", { limit: 1 });

    checks.push({
      check: "storage_access",
      success: !storageError,
      details: storageError?.message || "Storage accessible",
    });

    const overallHealth = checks.every(c => c.success);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          action: "health_check",
          overallHealth,
          timestamp: new Date().toISOString(),
          checks,
        }
      }),
      { 
        status: overallHealth ? 200 : 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Health check failed", 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}