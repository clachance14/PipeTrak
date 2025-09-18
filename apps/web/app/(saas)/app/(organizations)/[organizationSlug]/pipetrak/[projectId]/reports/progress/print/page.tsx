import { CompactProgressReport } from "@pipetrak/reports/components/CompactProgressReport";
import { LoadingState } from "@pipetrak/shared/components";
import { Suspense } from "react";

interface ProgressPrintPageProps {
	params: Promise<{
		projectId: string;
	}>;
	searchParams: Promise<{
		weekEnding?: string;
		groupBy?: "area" | "system" | "testPackage";
		showDeltas?: string;
		includeZeroProgress?: string;
		includeGrandTotal?: string;
	}>;
}

export default async function ProgressPrintPage({
	params,
	searchParams,
}: ProgressPrintPageProps) {
	const { projectId } = await params;
	const {
		weekEnding,
		groupBy = "area",
		showDeltas = "true",
		includeZeroProgress = "true",
		includeGrandTotal = "true",
	} = await searchParams;

	return (
		<Suspense fallback={<LoadingState />}>
			<CompactProgressReport
				projectId={projectId}
				weekEnding={weekEnding}
				groupBy={groupBy}
				options={{
					showDeltas: showDeltas === "true",
					includeZeroProgress: includeZeroProgress === "true",
					includeGrandTotal: includeGrandTotal === "true",
				}}
			/>
		</Suspense>
	);
}
