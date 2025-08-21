"use client";

import { Card, CardContent } from "@ui/components/card";
import { ReportHeader } from "./ReportHeader";

interface AuditReportContentProps {
  projectId: string;
  initialFilters?: Record<string, string>;
}

/**
 * Audit Trail Report Content Component
 * Shows complete audit log of system changes and user actions
 */
export function AuditReportContent({
  projectId,
  initialFilters = {},
}: AuditReportContentProps) {
  return (
    <div className="space-y-6">
      <ReportHeader
        title="Audit Trail Report"
        description="Complete audit log of system changes and user actions"
        reportType="Audit Trail"
        isLoading={false}
      />

      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Audit Trail Report</p>
            <p>Implementation coming soon</p>
            <p className="text-sm mt-2">Project ID: {projectId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}