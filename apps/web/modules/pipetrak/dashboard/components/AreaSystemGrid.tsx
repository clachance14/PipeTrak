'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/components/tooltip';
import { DrillDownSheet } from './DrillDownSheet';
import { 
  getHeatmapFillColor, 
  getHeatmapOpacity, 
  formatCompletionText,
  getTotalStalledCount,
  getUniqueAreas,
  getUniqueSystems 
} from '../lib/utils';
import type { AreaSystemMatrix, AreaSystemMatrixItem } from '../types';

interface AreaSystemGridProps {
  data: AreaSystemMatrix | null;
}

export function AreaSystemGrid({ data }: AreaSystemGridProps) {
  const [selectedCell, setSelectedCell] = useState<AreaSystemMatrixItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { areas, systems, gridData } = useMemo(() => {
    if (!data?.matrixData) {
      return { areas: [], systems: [], gridData: new Map() };
    }

    const areas = getUniqueAreas(data.matrixData);
    const systems = getUniqueSystems(data.matrixData);
    
    // Create lookup map for O(1) cell access
    const gridData = new Map<string, AreaSystemMatrixItem>();
    data.matrixData.forEach(item => {
      const key = `${item.area}|${item.system}`;
      gridData.set(key, item);
    });

    return { areas, systems, gridData };
  }, [data]);

  const handleCellClick = (item: AreaSystemMatrixItem) => {
    setSelectedCell(item);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedCell(null);
  };

  if (!data?.matrixData?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area × System Progress Matrix</CardTitle>
          <CardDescription>
            Interactive grid showing completion status by area and system combinations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No area/system data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate dimensions - responsive sizing to fill available space
  const maxCellSize = 100;
  const minCellSize = 60;
  const targetWidth = 1200; // Target container width
  
  // Calculate cell size to fill available width
  const availableWidth = targetWidth - 120; // Subtract label width
  const calculatedCellSize = Math.min(
    maxCellSize,
    Math.max(minCellSize, Math.floor(availableWidth / Math.max(systems.length, 1)))
  );
  
  const cellSize = calculatedCellSize;
  const labelHeight = 80;
  const labelWidth = 120;
  const gridWidth = systems.length * cellSize + labelWidth;
  const gridHeight = areas.length * cellSize + labelHeight;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Area × System Progress Matrix</CardTitle>
          <CardDescription>
            Completion percentage by area and system. Click cells to drill down.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto flex justify-center">
            <svg
              width={gridWidth}
              height={gridHeight}
              viewBox={`0 0 ${gridWidth} ${gridHeight}`}
              className="w-full max-w-[1400px]"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Column Headers (Systems) */}
              {systems.map((system, colIndex) => (
                <text
                  key={`system-${system}`}
                  x={labelWidth + colIndex * cellSize + cellSize / 2}
                  y={labelHeight - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-current"
                  transform={`rotate(-45, ${labelWidth + colIndex * cellSize + cellSize / 2}, ${labelHeight - 10})`}
                >
                  {system}
                </text>
              ))}

              {/* Row Headers (Areas) */}
              {areas.map((area, rowIndex) => (
                <text
                  key={`area-${area}`}
                  x={labelWidth - 10}
                  y={labelHeight + rowIndex * cellSize + cellSize / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-current"
                >
                  {area}
                </text>
              ))}

              {/* Grid Cells */}
              {areas.map((area, rowIndex) =>
                systems.map((system, colIndex) => {
                  const key = `${area}|${system}`;
                  const item = gridData.get(key);
                  
                  if (!item) {
                    // Empty cell
                    return (
                      <rect
                        key={key}
                        x={labelWidth + colIndex * cellSize}
                        y={labelHeight + rowIndex * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="rgb(243, 244, 246)" // gray-100
                        stroke="rgb(229, 231, 235)" // gray-200
                        strokeWidth={1}
                      />
                    );
                  }

                  const totalStalled = getTotalStalledCount(item.stalledCounts);
                  const fillColor = getHeatmapFillColor(item.completionPercent);
                  const opacity = getHeatmapOpacity(item.completionPercent);

                  return (
                    <g key={key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <rect
                            x={labelWidth + colIndex * cellSize}
                            y={labelHeight + rowIndex * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={fillColor}
                            fillOpacity={opacity}
                            stroke="rgb(229, 231, 235)"
                            strokeWidth={1}
                            className="cursor-pointer hover:stroke-2 hover:stroke-blue-500"
                            onClick={() => handleCellClick(item)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {area} × {system}
                            </p>
                            <p>{formatCompletionText(item.completedCount, item.totalCount)}</p>
                            {totalStalled > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p>Stalled Components:</p>
                                <p>7d: {item.stalledCounts.stalled7Days}</p>
                                <p>14d: {item.stalledCounts.stalled14Days}</p>
                                <p>21d+: {item.stalledCounts.stalled21Days}</p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Completion text */}
                      <text
                        x={labelWidth + colIndex * cellSize + cellSize / 2}
                        y={labelHeight + rowIndex * cellSize + cellSize / 2 - 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white pointer-events-none"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {item.completionPercent}%
                      </text>
                      
                      {/* Component count */}
                      <text
                        x={labelWidth + colIndex * cellSize + cellSize / 2}
                        y={labelHeight + rowIndex * cellSize + cellSize / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-white pointer-events-none"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        ({item.completedCount}/{item.totalCount})
                      </text>

                      {/* Stalled indicator triangle */}
                      {totalStalled > 0 && (
                        <polygon
                          points={`${labelWidth + colIndex * cellSize + cellSize - 8},${labelHeight + rowIndex * cellSize + 2} ${labelWidth + colIndex * cellSize + cellSize - 2},${labelHeight + rowIndex * cellSize + 2} ${labelWidth + colIndex * cellSize + cellSize - 2},${labelHeight + rowIndex * cellSize + 8}`}
                          fill="rgb(239, 68, 68)" // red-500
                          stroke="white"
                          strokeWidth={1}
                          className="pointer-events-none"
                        />
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-4 mx-auto">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>0-30%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>31-70%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>71-100%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-500"></div>
                <span>Has stalled components</span>
              </div>
              <div className="ml-8 pl-8 border-l">
                <p className="text-xs">
                  {areas.length} areas × {systems.length} systems = {data.matrixData.length} combinations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down sheet */}
      <DrillDownSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        cellData={selectedCell}
      />
    </TooltipProvider>
  );
}