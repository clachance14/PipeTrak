import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@saas/auth/lib/server";
import { fetchDashboardComponents } from "@pipetrak/dashboard/lib/data-loaders";

export async function GET(request: NextRequest) {
  console.log("[API] Dashboard components endpoint called");
  
  try {
    // Check authentication
    console.log("[API] Checking session...");
    const session = await getSession();
    console.log("[API] Session result:", session ? 'exists' : 'null');
    console.log("[API] User ID:", session?.user?.id);
    console.log("[API] User email:", session?.user?.email);
    
    if (!session) {
      console.error("[API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    
    console.log("[API] Project ID:", projectId);
    
    if (!projectId) {
      console.error("[API] No project ID provided");
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Parse filters from query params
    const filters: any = {};
    const area = searchParams.get("area");
    const system = searchParams.get("system");
    const status = searchParams.get("status");
    const testPackage = searchParams.get("testPackage");
    const drawing = searchParams.get("drawing");
    const search = searchParams.get("search");
    
    if (area) filters.area = area.split(",");
    if (system) filters.system = system.split(",");
    if (status) filters.status = status.split(",");
    if (testPackage) filters.testPackage = testPackage.split(",");
    if (drawing) filters.drawing = drawing.split(",");
    if (search) filters.search = search;

    const limit = Number.parseInt(searchParams.get("limit") || "100");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    console.log("[API] Parsed filters:", filters);
    console.log("[API] Limit:", limit, "Offset:", offset);

    // Fetch components from server-side function
    console.log("[API] Calling fetchDashboardComponents...");
    const result = await fetchDashboardComponents(
      projectId,
      filters,
      limit,
      offset
    );

    console.log("[API] fetchDashboardComponents result:", { 
      componentCount: result.components.length, 
      total: result.total 
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Dashboard components error:", error);
    console.error("[API] Error details:", error instanceof Error ? error.message : 'Unknown error');
    console.error("[API] Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard components",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}