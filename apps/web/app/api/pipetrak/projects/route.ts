import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@saas/auth/lib/server";
import { db } from "@repo/database";
import { z } from "zod";

const createProjectSchema = z.object({
  jobNumber: z.string().min(1).max(10),
  jobName: z.string().min(1).max(255),
  client: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  organizationId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    // Verify user is member of the organization
    const membership = await db.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }

    // Fetch projects for the organization
    const projects = await db.project.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        _count: {
          select: {
            components: true,
            drawings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Verify user is member of the organization
    const membership = await db.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }

    // Check if job number is unique within organization
    const existingProject = await db.project.findFirst({
      where: {
        organizationId: validatedData.organizationId,
        jobNumber: validatedData.jobNumber,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "Job number already exists in this organization" },
        { status: 400 }
      );
    }

    // Create the project
    const project = await db.project.create({
      data: {
        organizationId: validatedData.organizationId,
        jobNumber: validatedData.jobNumber,
        jobName: validatedData.jobName,
        client: validatedData.client || null,
        location: validatedData.location || null,
        description: validatedData.description || null,
        status: "ACTIVE",
        createdBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            components: true,
            drawings: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}