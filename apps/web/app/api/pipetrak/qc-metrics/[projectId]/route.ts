import { db } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { type NextRequest, NextResponse } from "next/server";

interface QCMetrics {
	totalWelds: number;
	acceptedWelds: number;
	rejectedWelds: number;
	pendingWelds: number;
	completedWelds: number;
	acceptanceRate: number;
	pwhtRequired: number;
	pwhtComplete: number;
	pwhtCompletionRate: number;
	activeWelders: number;
	trends: {
		weldsLastWeek: number;
		weldsWeekOverWeekChange: number;
		acceptanceRateChange: number;
		pwhtCompletionRate: number;
	};
}

interface RouteParams {
	params: Promise<{
		projectId: string;
	}>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { projectId } = await params;

		// Query QC metrics from the database
		const weldsData = await db.fieldWeld.findMany({
			where: {
				projectId: projectId,
			},
			include: {
				welder: true,
			},
		});

		// Calculate metrics
		const totalWelds = weldsData.length;
		const acceptedWelds = weldsData.filter(
			(weld: any) => weld.qcStatus === "ACCEPTED",
		).length;
		const rejectedWelds = weldsData.filter(
			(weld: any) => weld.qcStatus === "REJECTED",
		).length;
		const pendingWelds = weldsData.filter(
			(weld: any) => weld.qcStatus === "PENDING" || !weld.qcStatus,
		).length;

		const completedWelds = await db.component.count({
			where: {
				projectId,
				type: "FIELD_WELD",
				milestones: {
					some: {
						milestoneName: "Weld Made",
						isCompleted: true,
					},
				},
			},
		});
		const acceptanceRate =
			totalWelds > 0 ? Math.round((acceptedWelds / totalWelds) * 100) : 0;

		// PWHT metrics
		const pwhtRequired = weldsData.filter(
			(weld: any) => weld.pwhtRequired,
		).length;
		const pwhtComplete = weldsData.filter(
			(weld: any) => weld.pwhtComplete,
		).length;
		const pwhtCompletionRate =
			pwhtRequired > 0
				? Math.round((pwhtComplete / pwhtRequired) * 100)
				: 0;

		// Active welders
		const activeWelders = new Set(
			weldsData.map((weld: any) => weld.welderId).filter(Boolean),
		).size;

		// TODO: Implement trend calculations with historical data
		const trends = {
			weldsLastWeek: 0,
			weldsWeekOverWeekChange: 0,
			acceptanceRateChange: 0,
			pwhtCompletionRate,
		};

		const metrics: QCMetrics = {
			totalWelds,
			acceptedWelds,
			rejectedWelds,
			pendingWelds,
			completedWelds,
			acceptanceRate,
			pwhtRequired,
			pwhtComplete,
			pwhtCompletionRate,
			activeWelders,
			trends,
		};

		// Get project info
		const project = await db.project.findUnique({
			where: { id: projectId },
			select: { id: true, jobName: true },
		});

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			metrics,
			project,
		});
	} catch (error) {
		console.error("Error fetching QC metrics:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
