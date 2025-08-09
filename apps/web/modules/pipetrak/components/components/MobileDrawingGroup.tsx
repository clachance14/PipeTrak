"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { 
  ChevronDown,
  ChevronRight,
  MapPin,
  Package2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Minus
} from "lucide-react";
import { cn } from "@ui/lib";
import { MobileComponentCard } from "./MobileComponentCard";
import type { ComponentWithMilestones } from "../../types";

interface MobileDrawingGroupProps {
  drawingNumber: string;
  components: ComponentWithMilestones[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedIds: Set<string>;
  onSelectComponent: (componentId: string, selected: boolean) => void;
  onSelectAll: (componentIds: string[], selected: boolean) => void;
  onComponentClick: (componentId: string) => void;
  onQuickUpdate: (componentId: string, status: string) => void;
  onEdit: (componentId: string) => void;
}

export function MobileDrawingGroup({
  drawingNumber,
  components,
  isExpanded,
  onToggleExpand,
  selectedIds,
  onSelectComponent,
  onSelectAll,
  onComponentClick,
  onQuickUpdate,
  onEdit
}: MobileDrawingGroupProps) {
  // Calculate drawing-level statistics
  const stats = useMemo(() => {
    const total = components.length;
    const completed = components.filter(c => c.status === "COMPLETED").length;
    const inProgress = components.filter(c => c.status === "IN_PROGRESS").length;
    const notStarted = components.filter(c => c.status === "NOT_STARTED").length;
    
    const totalProgress = components.reduce((sum, c) => sum + (c.completionPercent || 0), 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    
    const selectedInGroup = components.filter(c => selectedIds.has(c.id)).length;
    const allSelected = selectedInGroup === total && total > 0;
    const someSelected = selectedInGroup > 0 && selectedInGroup < total;
    
    return {
      total,
      completed,
      inProgress,
      notStarted,
      avgProgress,
      selectedInGroup,
      allSelected,
      someSelected
    };
  }, [components, selectedIds]);

  // Determine drawing status color
  const getStatusColor = () => {
    if (stats.completed === stats.total && stats.total > 0) {
      return "border-fieldComplete bg-fieldComplete/5";
    } else if (stats.inProgress > 0 || stats.completed > 0) {
      return "border-blue-500 bg-blue-50/50";
    }
    return "border-gray-300 bg-white";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (stats.completed === stats.total && stats.total > 0) {
      return <CheckCircle className="h-5 w-5 text-fieldComplete" />;
    } else if (stats.inProgress > 0) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-fieldPending" />;
  };

  const handleSelectAll = () => {
    const componentIds = components.map(c => c.id);
    onSelectAll(componentIds, !stats.allSelected);
  };

  return (
    <div className="space-y-2">
      {/* Drawing Header Card */}
      <Card 
        className={cn(
          "transition-all duration-200",
          getStatusColor(),
          stats.selectedInGroup > 0 && "ring-2 ring-primary"
        )}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Main Header Row */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Selection Checkbox */}
                <div className="pt-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll();
                    }}
                    className="cursor-pointer"
                  >
                    {stats.someSelected && !stats.allSelected ? (
                      // Custom indeterminate state
                      <div className="h-5 w-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                        <Minus className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Checkbox
                        checked={stats.allSelected}
                        onCheckedChange={handleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5"
                      />
                    )}
                  </div>
                </div>
                
                {/* Drawing Info */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={onToggleExpand}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-base">
                      {drawingNumber || "No Drawing"}
                    </h3>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Component Count and Status */}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Package2 className="h-3 w-3 mr-1" />
                      {stats.total} component{stats.total !== 1 ? 's' : ''}
                    </Badge>
                    
                    {stats.selectedInGroup > 0 && (
                      <Badge variant="default" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {stats.selectedInGroup} selected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status Icon */}
              <div className="pt-1">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-bold">{stats.avgProgress}%</span>
              </div>
              <Progress value={stats.avgProgress} className="h-2" />
              
              {/* Status Breakdown - Only show when collapsed */}
              {!isExpanded && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  {stats.completed > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-fieldComplete" />
                      {stats.completed} complete
                    </span>
                  )}
                  {stats.inProgress > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      {stats.inProgress} in progress
                    </span>
                  )}
                  {stats.notStarted > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-fieldPending" />
                      {stats.notStarted} not started
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Quick Actions - Show when collapsed and items selected */}
            {!isExpanded && stats.selectedInGroup > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger bulk status update for selected components
                    components
                      .filter(c => selectedIds.has(c.id) && c.status === "NOT_STARTED")
                      .forEach(c => onQuickUpdate(c.id, "IN_PROGRESS"));
                  }}
                >
                  Start Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger bulk status update for selected components
                    components
                      .filter(c => selectedIds.has(c.id) && c.status === "IN_PROGRESS")
                      .forEach(c => onQuickUpdate(c.id, "COMPLETED"));
                  }}
                >
                  Complete Selected
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Expanded Component List */}
      {isExpanded && (
        <div className={cn(
          "space-y-3 pl-4 border-l-2",
          getStatusColor().split(' ')[0] // Use same border color as header
        )}>
          {components.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center text-muted-foreground">
                No components in this drawing
              </CardContent>
            </Card>
          ) : (
            components.map((component) => (
              <MobileComponentCard
                key={component.id}
                component={component}
                isSelected={selectedIds.has(component.id)}
                onSelect={(selected) => onSelectComponent(component.id, selected)}
                onClick={() => onComponentClick(component.id)}
                onQuickUpdate={(status) => onQuickUpdate(component.id, status)}
                onEdit={() => onEdit(component.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}