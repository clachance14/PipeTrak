import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Get the session to check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { organizationId } = body;

		if (!organizationId) {
			return NextResponse.json(
				{ error: "Organization ID is required" },
				{ status: 400 }
			);
		}

		// Check if the user has permission to delete this organization
		// First check if user is a global admin
		const isAdmin = session.user.role === "admin" || session.user.role === "super-admin";
		
		if (!isAdmin) {
			// If not admin, check if they're an owner of this organization
			const membership = await db.member.findFirst({
				where: {
					userId: session.user.id,
					organizationId: organizationId,
				},
			});

			if (!membership) {
				return NextResponse.json(
					{ error: "You are not a member of this organization" },
					{ status: 403 }
				);
			}

			// Check if the user is an owner (only owners can delete organizations)
			if (membership.role !== "owner") {
				return NextResponse.json(
					{ error: `Only organization owners can delete organizations. Your role: ${membership.role}` },
					{ status: 403 }
				);
			}
		}

		// Delete the organization (cascade will handle related records)
		await db.organization.delete({
			where: {
				id: organizationId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting organization:", error);
		return NextResponse.json(
			{ error: "Failed to delete organization" },
			{ status: 500 }
		);
	}
}