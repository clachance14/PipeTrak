import { getSession } from "@saas/auth/lib/server";
import { db } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

interface QCSummary {
	totalWelds: number;
	activeWelders: number;
	acceptanceRate: number;
	totalInspected: number;
}

interface RouteParams {
	params: Promise<{
		projectId: string;
	}>;
}

export async function GET(
	_request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { projectId } = await params;

		// Query QC summary from the database
		const weldsData = await db.fieldWeld.findMany({
			where: {
				projectId: projectId,
			},
			include: {
				welder: true,
			},
		});

		// Calculate summary metrics
		const totalWelds = weldsData.length;
		const inspectedWelds = weldsData.filter((weld: any) => weld.qcStatus && weld.qcStatus !== "PENDING").length;
		const acceptedWelds = weldsData.filter((weld: any) => weld.qcStatus === "ACCEPTED").length;
		const acceptanceRate = inspectedWelds > 0 ? Math.round((acceptedWelds / inspectedWelds) * 100) : 0;
		const activeWelders = new Set(weldsData.map((weld: any) => weld.welderId).filter(Boolean)).size;

		const summary: QCSummary = {
			totalWelds,
			activeWelders,
			acceptanceRate,
			totalInspected: inspectedWelds,
		};

		return NextResponse.json({
			summary,
		});
	} catch (error) {
		console.error("Error fetching QC summary:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
