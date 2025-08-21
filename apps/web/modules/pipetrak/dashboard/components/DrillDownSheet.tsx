'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@ui/components/sheet';
import { Badge } from '@ui/components/badge';
import { Progress } from '@ui/components/progress';
import { formatCompletionText, getTotalStalledCount } from '../lib/utils';
import type { AreaSystemMatrixItem } from '../types';

interface DrillDownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: AreaSystemMatrixItem | null;
}

export function DrillDownSheet({ isOpen, onClose, cellData }: DrillDownSheetProps) {
  if (!cellData) {
    return null;
  }

  const totalStalled = getTotalStalledCount(cellData.stalledCounts);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {cellData.area} × {cellData.system}
          </SheetTitle>
          <SheetDescription>
            Detailed view of components in this area/system combination
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Overall Progress</h3>
              <span className="text-sm text-muted-foreground">
                {formatCompletionText(cellData.completedCount, cellData.totalCount)}
              </span>
            </div>
            <Progress 
              value={cellData.completionPercent} 
              className="h-2"
            />
          </div>

          {/* Component Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Component Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {cellData.completedCount}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-muted-foreground">
                  {cellData.totalCount - cellData.completedCount}
                </div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>

          {/* Stalled Components */}
          {totalStalled > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Stalled Components</h3>
                <Badge variant="destructive" className="text-xs">
                  {totalStalled} stalled
                </Badge>
              </div>
              
              <div className="space-y-3">
                {cellData.stalledCounts.stalled7Days > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <div className="text-sm font-medium text-orange-800">
                        7+ Days Stalled
                      </div>
                      <div className="text-xs text-orange-600">
                        No progress for over a week
                      </div>
                    </div>
                    <div className="text-lg font-bold text-orange-800">
                      {cellData.stalledCounts.stalled7Days}
                    </div>
                  </div>
                )}

                {cellData.stalledCounts.stalled14Days > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="text-sm font-medium text-red-800">
                        14+ Days Stalled
                      </div>
                      <div className="text-xs text-red-600">
                        No progress for over two weeks
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-800">
                      {cellData.stalledCounts.stalled14Days}
                    </div>
                  </div>
                )}

                {cellData.stalledCounts.stalled21Days > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-300">
                    <div>
                      <div className="text-sm font-medium text-red-900">
                        21+ Days Stalled
                      </div>
                      <div className="text-xs text-red-700">
                        Critical: No progress for over three weeks
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-900">
                      {cellData.stalledCounts.stalled21Days}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Items (Placeholder) */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="text-sm text-muted-foreground">
              <p>• View detailed component list (Coming Soon)</p>
              <p>• Assign work orders (Coming Soon)</p>
              <p>• Export progress report (Coming Soon)</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Area: {cellData.area}</p>
              <p>System: {cellData.system}</p>
              <p>Total Components: {cellData.totalCount}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}