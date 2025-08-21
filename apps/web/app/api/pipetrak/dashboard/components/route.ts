import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@saas/auth/lib/server";
import { fetchDashboardComponents } from "@pipetrak/dashboard/lib/data-loaders";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    
    if (!projectId) {
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

    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch components from server-side function
    const result = await fetchDashboardComponents(
      projectId,
      filters,
      limit,
      offset
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Dashboard components error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard components" },
      { status: 500 }
    );
  }
}