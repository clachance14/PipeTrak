import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { CompactProgressReport } from "@pipetrak/reports/components/CompactProgressReport";
export default async function ProgressPrintPage({ params, searchParams, }) {
    const { projectId } = await params;
    const { weekEnding, groupBy = "area", showDeltas = "true", includeZeroProgress = "true", includeGrandTotal = "true", } = await searchParams;
    return (<Suspense fallback={<LoadingState />}>
			<CompactProgressReport projectId={projectId} weekEnding={weekEnding} groupBy={groupBy} options={{
            showDeltas: showDeltas === "true",
            includeZeroProgress: includeZeroProgress === "true",
            includeGrandTotal: includeGrandTotal === "true",
        }}/>
		</Suspense>);
}
