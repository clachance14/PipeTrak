'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/components/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@ui/components/toggle-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@ui/components/sheet';
import { DrillDownSheet } from './DrillDownSheet';
import { MapPin, Package, Box } from 'lucide-react';
import type { ComponentWithMilestones } from '../../types';

interface MilestoneProgressMatrixProps {
  components: ComponentWithMilestones[];
  showSystems?: boolean;
  showTestPackages?: boolean;
}

interface MilestoneStats {
  totalCount: number;
  completedCount: number;
  completionPercent: number;
}

interface MatrixCell {
  area: string;
  milestone: string;
  stats: MilestoneStats;
  components: ComponentWithMilestones[];
}

export function MilestoneProgressMatrix({ 
  components, 
  showSystems = false,
  showTestPackages = false 
}: MilestoneProgressMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'area' | 'system' | 'testPackage'>('area');

  const { rows, columns, gridData } = useMemo(() => {
    // Define the correct milestone order - using normalized names only
    const milestoneOrder = [
      'Receive',
      'Install',
      'Punch',
      'Test',
      'Restore',
      'Paint',
      'Insulate'
    ];
    
    // Map installation-related milestones to "Install" for display
    const installMilestones = new Set(['Install', 'Installed', 'Erect', 'Erected', 'Connect', 'Connected', 'Weld', 'Welded', 'Fit-up', 'Fitted']);
    
    // Always show all milestones in the defined order, regardless of data availability
    const milestones = [...milestoneOrder];
    
    // Additionally check if there are any milestones in the data that aren't in our standard order
    const additionalMilestones = new Set<string>();
    components.forEach(comp => {
      comp.milestones?.forEach(m => {
        // Normalize milestone names
        let normalizedName = m.milestoneName;
        if (installMilestones.has(m.milestoneName)) {
          normalizedName = 'Install';
        } else if (m.milestoneName === 'Received') {
          normalizedName = 'Receive';
        } else if (m.milestoneName === 'Punched') {
          normalizedName = 'Punch';
        } else if (m.milestoneName === 'Tested') {
          normalizedName = 'Test';
        } else if (m.milestoneName === 'Restored') {
          normalizedName = 'Restore';
        } else if (m.milestoneName === 'Painted') {
          normalizedName = 'Paint';
        } else if (m.milestoneName === 'Insulated') {
          normalizedName = 'Insulate';
        }
        
        // If it's not in our standard order, add it as additional
        if (!milestoneOrder.includes(normalizedName)) {
          additionalMilestones.add(normalizedName);
        }
      });
    });
    
    // Append any additional milestones not in our standard order
    if (additionalMilestones.size > 0) {
      milestones.push(...Array.from(additionalMilestones).sort());
    }

    // Get unique rows based on view mode
    const rowsSet = new Set<string>();
    components.forEach(comp => {
      if (viewMode === 'area' && comp.area) {
        rowsSet.add(comp.area);
      } else if (viewMode === 'system' && comp.system) {
        rowsSet.add(comp.system);
      } else if (viewMode === 'testPackage' && comp.testPackage) {
        rowsSet.add(comp.testPackage);
      }
    });
    const rows = Array.from(rowsSet).sort();

    // Build grid data
    const gridData = new Map<string, MatrixCell>();
    
    rows.forEach(row => {
      milestones.forEach(milestone => {
        // Filter components for this cell
        const cellComponents = components.filter(comp => {
          const rowMatch = viewMode === 'area' ? comp.area === row :
                          viewMode === 'system' ? comp.system === row :
                          comp.testPackage === row;
          
          // Check if component has this milestone (handling grouped Install milestones)
          const hasMilestone = comp.milestones?.some(m => {
            if (milestone === 'Install') {
              return installMilestones.has(m.milestoneName);
            } else if (milestone === 'Receive') {
              return m.milestoneName === 'Receive' || m.milestoneName === 'Received';
            } else if (milestone === 'Punch') {
              return m.milestoneName === 'Punch' || m.milestoneName === 'Punched';
            } else if (milestone === 'Test') {
              return m.milestoneName === 'Test' || m.milestoneName === 'Tested';
            } else if (milestone === 'Restore') {
              return m.milestoneName === 'Restore' || m.milestoneName === 'Restored';
            } else if (milestone === 'Paint') {
              return m.milestoneName === 'Paint' || m.milestoneName === 'Painted';
            } else if (milestone === 'Insulate') {
              return m.milestoneName === 'Insulate' || m.milestoneName === 'Insulated';
            }
            return m.milestoneName === milestone;
          });
          
          return rowMatch && hasMilestone;
        });

        if (cellComponents.length > 0) {
          // Calculate stats for this cell
          let totalCount = 0;
          let completedCount = 0;

          cellComponents.forEach(comp => {
            // Find matching milestones (handling grouped Install milestones)
            const matchingMilestones = comp.milestones?.filter(m => {
              if (milestone === 'Install') {
                return installMilestones.has(m.milestoneName);
              } else if (milestone === 'Receive') {
                return m.milestoneName === 'Receive' || m.milestoneName === 'Received';
              } else if (milestone === 'Punch') {
                return m.milestoneName === 'Punch' || m.milestoneName === 'Punched';
              } else if (milestone === 'Test') {
                return m.milestoneName === 'Test' || m.milestoneName === 'Tested';
              } else if (milestone === 'Restore') {
                return m.milestoneName === 'Restore' || m.milestoneName === 'Restored';
              } else if (milestone === 'Paint') {
                return m.milestoneName === 'Paint' || m.milestoneName === 'Painted';
              } else if (milestone === 'Insulate') {
                return m.milestoneName === 'Insulate' || m.milestoneName === 'Insulated';
              }
              return m.milestoneName === milestone;
            }) || [];
            
            // For Install milestone, count all installation-related milestones
            matchingMilestones.forEach(milestone_data => {
              totalCount++;
              if (milestone_data.isCompleted) {
                completedCount++;
              }
            });
          });

          const completionPercent = totalCount > 0 
            ? Math.round((completedCount / totalCount) * 100) 
            : 0;

          const key = `${row}|${milestone}`;
          gridData.set(key, {
            area: row,
            milestone,
            stats: {
              totalCount,
              completedCount,
              completionPercent
            },
            components: cellComponents
          });
        }
      });
    });

    return { rows, columns: milestones, gridData };
  }, [components, viewMode]);

  const handleCellClick = (cell: MatrixCell) => {
    setSelectedCell(cell);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedCell(null);
  };

  const getHeatmapColor = (percent: number) => {
    // Exact same as AreaSystemGrid getHeatmapFillColor
    if (percent >= 71) {
      return "#10b981"; // green-500
    } else if (percent >= 31) {
      return "#f59e0b"; // yellow-500  
    } else if (percent > 0) {
      return "#ef4444"; // red-500
    }
    return 'rgb(243, 244, 246)'; // gray-100 for 0%
  };

  const getOpacity = (percent: number) => {
    // Exact same as AreaSystemGrid getHeatmapOpacity
    if (percent === 0) return 1; // Full opacity for empty cells
    if (percent <= 10) return 0.2;
    if (percent <= 20) return 0.3;
    if (percent <= 30) return 0.4;
    if (percent <= 40) return 0.5;
    if (percent <= 50) return 0.6;
    if (percent <= 60) return 0.7;
    if (percent <= 70) return 0.8;
    if (percent <= 80) return 0.9;
    return 1.0;
  };

  if (components.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestone Progress Matrix</CardTitle>
          <CardDescription>
            Track milestone completion across areas, systems, or test packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No component data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate dimensions - responsive sizing to fill available space
  // Dynamically size cells based on number of columns/rows
  const maxCellWidth = 85;
  const minCellWidth = 50;
  const targetWidth = 1200; // Target container width
  
  // Calculate cell size to fill available width
  const availableWidth = targetWidth - 120; // Subtract label width
  const calculatedCellWidth = Math.min(
    maxCellWidth,
    Math.max(minCellWidth, Math.floor(availableWidth / Math.max(columns.length, 1)))
  );
  
  const cellWidth = calculatedCellWidth;
  const cellHeight = calculatedCellWidth; // Keep cells square
  const labelHeight = 80;
  const labelWidth = 120;
  const gridWidth = columns.length * cellWidth + labelWidth;
  const gridHeight = rows.length * cellHeight + labelHeight;

  const viewOptions = [
    { value: 'area', label: 'By Area' },
    ...(showSystems ? [{ value: 'system', label: 'By System' }] : []),
    ...(showTestPackages ? [{ value: 'testPackage', label: 'By Test Package' }] : [])
  ];

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestone Progress Matrix</CardTitle>
              <CardDescription>
                Track completion by milestone across {viewMode === 'area' ? 'areas' : viewMode === 'system' ? 'systems' : 'test packages'}
              </CardDescription>
            </div>
            {viewOptions.length > 1 && (
              <ToggleGroup 
                type="single" 
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as any)}
                size="sm"
              >
                <ToggleGroupItem value="area" aria-label="By Area">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Area
                </ToggleGroupItem>
                {showSystems && (
                  <ToggleGroupItem value="system" aria-label="By System">
                    <Box className="h-3.5 w-3.5 mr-1" />
                    System
                  </ToggleGroupItem>
                )}
                {showTestPackages && (
                  <ToggleGroupItem value="testPackage" aria-label="By Test Package">
                    <Package className="h-3.5 w-3.5 mr-1" />
                    Test Package
                  </ToggleGroupItem>
                )}
              </ToggleGroup>
            )}
          </div>
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
              {/* Column Headers (Milestones) */}
              {columns.map((milestone, colIndex) => (
                <text
                  key={`milestone-${milestone}`}
                  x={labelWidth + colIndex * cellWidth + cellWidth / 2}
                  y={labelHeight - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-current"
                  transform={`rotate(-45, ${labelWidth + colIndex * cellWidth + cellWidth / 2}, ${labelHeight - 10})`}
                >
                  {milestone}
                </text>
              ))}

              {/* Row Headers (Areas/Systems/Test Packages) */}
              {rows.map((row, rowIndex) => (
                <text
                  key={`row-${row}`}
                  x={labelWidth - 10}
                  y={labelHeight + rowIndex * cellHeight + cellHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-current"
                >
                  {row}
                </text>
              ))}

              {/* Grid Cells */}
              {rows.map((row, rowIndex) =>
                columns.map((milestone, colIndex) => {
                  const key = `${row}|${milestone}`;
                  const cell = gridData.get(key);
                  
                  if (!cell) {
                    // Empty cell
                    return (
                      <rect
                        key={key}
                        x={labelWidth + colIndex * cellWidth}
                        y={labelHeight + rowIndex * cellHeight}
                        width={cellWidth}
                        height={cellHeight}
                        fill="rgb(243, 244, 246)" // gray-100
                        stroke="rgb(229, 231, 235)" // gray-200
                        strokeWidth={1}
                      />
                    );
                  }

                  const fillColor = getHeatmapColor(cell.stats.completionPercent);
                  const opacity = getOpacity(cell.stats.completionPercent);

                  return (
                    <g key={key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <rect
                            x={labelWidth + colIndex * cellWidth}
                            y={labelHeight + rowIndex * cellHeight}
                            width={cellWidth}
                            height={cellHeight}
                            fill={fillColor}
                            fillOpacity={opacity}
                            stroke="rgb(229, 231, 235)"
                            strokeWidth={1}
                            className="cursor-pointer hover:stroke-2 hover:stroke-blue-500"
                            onClick={() => handleCellClick(cell)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {row} - {milestone}
                            </p>
                            <p>
                              {cell.stats.completedCount}/{cell.stats.totalCount} completed
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cell.stats.completionPercent}% complete
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Completion text - matching AreaSystemGrid exactly */}
                      <text
                        x={labelWidth + colIndex * cellWidth + cellWidth / 2}
                        y={labelHeight + rowIndex * cellHeight + cellHeight / 2 - 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white pointer-events-none"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {cell.stats.completionPercent}%
                      </text>
                      
                      {/* Component count - matching AreaSystemGrid exactly */}
                      <text
                        x={labelWidth + colIndex * cellWidth + cellWidth / 2}
                        y={labelHeight + rowIndex * cellHeight + cellHeight / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-white pointer-events-none"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        ({cell.stats.completedCount}/{cell.stats.totalCount})
                      </text>
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
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                <span>No data</span>
              </div>
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
              <div className="ml-8 pl-8 border-l">
                <p className="text-xs">
                  {rows.length} {viewMode === 'area' ? 'areas' : viewMode === 'system' ? 'systems' : 'test packages'} × {columns.length} milestones
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom drill-down sheet for milestone view */}
      {selectedCell && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>
                {selectedCell.area} - {selectedCell.milestone}
              </SheetTitle>
              <SheetDescription>
                {selectedCell.stats.completedCount} of {selectedCell.stats.totalCount} components completed
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCell.stats.completedCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedCell.stats.totalCount - selectedCell.stats.completedCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">
                    {selectedCell.stats.completionPercent}%
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Components in this cell:</h4>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {selectedCell.components.map(comp => {
                    // Find matching milestones for the selected cell (handling grouped Install milestones)
                    const installMilestones = new Set(['Install', 'Installed', 'Erect', 'Erected', 'Connect', 'Connected', 'Weld', 'Welded', 'Fit-up', 'Fitted']);
                    
                    const matchingMilestones = comp.milestones?.filter(m => {
                      if (selectedCell.milestone === 'Install') {
                        return installMilestones.has(m.milestoneName);
                      } else if (selectedCell.milestone === 'Receive') {
                        return m.milestoneName === 'Receive' || m.milestoneName === 'Received';
                      } else if (selectedCell.milestone === 'Punch') {
                        return m.milestoneName === 'Punch' || m.milestoneName === 'Punched';
                      } else if (selectedCell.milestone === 'Test') {
                        return m.milestoneName === 'Test' || m.milestoneName === 'Tested';
                      } else if (selectedCell.milestone === 'Restore') {
                        return m.milestoneName === 'Restore' || m.milestoneName === 'Restored';
                      } else if (selectedCell.milestone === 'Paint') {
                        return m.milestoneName === 'Paint' || m.milestoneName === 'Painted';
                      } else if (selectedCell.milestone === 'Insulate') {
                        return m.milestoneName === 'Insulate' || m.milestoneName === 'Insulated';
                      }
                      return m.milestoneName === selectedCell.milestone;
                    }) || [];
                    
                    const allCompleted = matchingMilestones.length > 0 && matchingMilestones.every(m => m.isCompleted);
                    const someCompleted = matchingMilestones.some(m => m.isCompleted);
                    
                    return (
                      <div key={comp.id} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{comp.componentId}</p>
                            <p className="text-xs text-muted-foreground">
                              {comp.type} • {comp.spec} • {comp.size}
                            </p>
                            {selectedCell.milestone === 'Install' && matchingMilestones.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {matchingMilestones.map(m => m.milestoneName).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            allCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : someCompleted
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {allCompleted ? 'Complete' : someCompleted ? 'Partial' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}