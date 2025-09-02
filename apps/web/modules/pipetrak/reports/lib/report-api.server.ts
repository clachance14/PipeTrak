/**
 * Server-side API client for PipeTrak reports
 * Only for use in Server Components
 */

import "server-only";
import { getServerApiClient } from "@shared/lib/server";
import type {
	ProgressReportRequest,
	ProgressReportResponse,
	ComponentDetailsRequest,
	ComponentDetailsResponse,
	TestPackageReadinessRequest,
	TestPackageReadinessResponse,
	FilterOptionsResponse,
} from "../types";

/**
 * Server-side progress report generation
 */
export async function generateProgressReportServer(
	request: ProgressReportRequest,
): Promise<ProgressReportResponse> {
	const apiClient = await getServerApiClient();

	const response = await apiClient.pipetrak.reports.generate.progress.$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to generate progress report");
	}

	return response.json();
}

/**
 * Server-side component details report
 */
export async function getComponentDetailsReportServer(
	request: ComponentDetailsRequest,
): Promise<ComponentDetailsResponse> {
	const apiClient = await getServerApiClient();

	const response = await apiClient.pipetrak.reports.generate.components.$post(
		{
			json: request,
		},
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(
			error.error || "Failed to generate component details report",
		);
	}

	return response.json();
}

/**
 * Server-side test package readiness
 */
export async function generateTestPackageReadinessServer(
	request: TestPackageReadinessRequest,
): Promise<TestPackageReadinessResponse> {
	const apiClient = await getServerApiClient();

	const response = await apiClient.pipetrak.reports.generate[
		"test-packages"
	].$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(
			error.error || "Failed to generate test package readiness report",
		);
	}

	return response.json();
}

/**
 * Server-side filter options
 */
export async function getReportFilterOptionsServer(
	projectId: string,
): Promise<FilterOptionsResponse> {
	const apiClient = await getServerApiClient();

	const response = await apiClient.pipetrak.reports.filters[
		":projectId"
	].$get({
		param: { projectId },
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to get filter options");
	}

	return response.json();
}
