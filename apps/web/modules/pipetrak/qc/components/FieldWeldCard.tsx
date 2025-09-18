"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { 
  Check, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FlameKindling,
  Zap,
  User,
  Calendar,
  MapPin,
  Package,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import type { FieldWeldRecord } from "../types";

// Types based on the FieldWeldTable component
type FieldWeldData = FieldWeldRecord;

interface FieldWeldCardProps {
  fieldWeld: FieldWeldData;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onMarkComplete?: () => void;
  onClick?: () => void;
}

export function FieldWeldCard({ 
  fieldWeld, 
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onEdit,
  onMarkComplete,
  onClick
}: FieldWeldCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getNdeStatusIcon = () => {
    switch (fieldWeld.ndeResult?.toLowerCase()) {
      case 'accept':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'reject':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'repair':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNdeStatusColor = () => {
    switch (fieldWeld.ndeResult?.toLowerCase()) {
      case 'accept':
        return "bg-green-100 text-green-800 border-green-200";
      case 'reject':
        return "bg-red-100 text-red-800 border-red-200";
      case 'repair':
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPwhtStatus = () => {
    if (!fieldWeld.pwhtRequired) {
      return { text: "N/A", color: "bg-gray-100 text-gray-600 border-gray-200", icon: null };
    }
    
    if (fieldWeld.datePwht) {
      return { 
        text: "Complete", 
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <FlameKindling className="h-3 w-3" />
      };
    }
    
    return { 
      text: "Required", 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: <FlameKindling className="h-3 w-3" />
    };
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
    const diff = currentX - startX;
    
    // Start dragging if moved more than 10px
    if (Math.abs(diff) > 10 && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    const diff = currentX - startX;
    
    // Swipe right to approve (threshold: 100px)
    if (diff > 100 && onApprove && !fieldWeld.ndeResult) {
      onApprove();
    }
    // Swipe left to reject (threshold: -100px)
    else if (diff < -100 && onReject && !fieldWeld.ndeResult) {
      onReject();
    }
    // If not a significant swipe, treat as tap
    else if (Math.abs(diff) < 10 && onClick) {
      onClick();
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const pwhtStatus = getPwhtStatus();
  const areaLabel = fieldWeld.drawingArea ?? fieldWeld.component?.area ?? "-";
  const systemLabel = fieldWeld.drawingSystem ?? fieldWeld.component?.system ?? "-";
  const weldTypeLabel = fieldWeld.weldType?.description
    ?? fieldWeld.weldType?.code
    ?? fieldWeld.weldTypeCode
    ?? "Unknown weld type";

  return (
    <div 
      ref={cardRef}
      className={cn(
        "relative transition-all duration-200",
        isSelected && "ring-2 ring-primary shadow-lg",
        isDragging && "opacity-90"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isDragging ? `translateX(${currentX - startX}px)` : 'translateX(0)',
      }}
    >
      {/* Swipe indicators */}
      {isDragging && !fieldWeld.ndeResult && (
        <>
          {currentX - startX > 50 && (
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-green-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          )}
          {currentX - startX < -50 && (
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
        </>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              className="h-6 w-6 rounded border-gray-300 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">{fieldWeld.weldIdNumber}</h3>
                <p className="text-sm text-muted-foreground">{weldTypeLabel}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {getNdeStatusIcon()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(() => {
                  const dateWelded = fieldWeld.dateWelded;
                  const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
                  const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
                  return !isComplete && onMarkComplete;
                })() && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onMarkComplete?.();
                  }}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {!fieldWeld.ndeResult && onApprove && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Approve NDE
                  </DropdownMenuItem>
                )}
                {!fieldWeld.ndeResult && onReject && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}>
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Reject NDE
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Badges Row */}
        <div className="flex flex-wrap gap-2">
          {/* Weld Status - Most Important */}
          <Badge 
            status="info" 
            className={cn(
              "text-sm py-1 px-3 font-semibold",
              (() => {
                const dateWelded = fieldWeld.dateWelded;
                const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
                const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
                return isComplete 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-600 border-gray-200";
              })()
            )}
          >
            {(() => {
              const dateWelded = fieldWeld.dateWelded;
              const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
              const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
              return isComplete ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />;
            })()}
            <span className="ml-2">
              Weld: {(() => {
                const dateWelded = fieldWeld.dateWelded;
                const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
                const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
                return isComplete ? "Complete" : "Pending";
              })()}
            </span>
          </Badge>

          <Badge 
            status="info" 
            className={cn("text-sm py-1 px-3", getNdeStatusColor())}
          >
            {getNdeStatusIcon()}
            <span className="ml-2">
              NDE: {fieldWeld.ndeResult || "Pending"}
            </span>
          </Badge>
          
          <Badge 
            status="info" 
            className={cn("text-sm py-1 px-3", pwhtStatus.color)}
          >
            {pwhtStatus.icon}
            <span className="ml-2">
              PWHT: {pwhtStatus.text}
            </span>
          </Badge>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Package: {fieldWeld.packageNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{fieldWeld.drawing.number}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {(() => {
                  const dateWelded = fieldWeld.dateWelded;
                  const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
                  
                  if (dateWelded) {
                    return new Date(dateWelded).toLocaleDateString();
                  }if (wmMilestone?.isCompleted && wmMilestone.completedAt) {
                    return `${new Date(wmMilestone.completedAt).toLocaleDateString()} (Milestone)`;
                  }if (wmMilestone?.isCompleted) {
                    return "Complete (Milestone)";
                  }
                    return "Not completed";
                })()}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="font-medium">Size: {fieldWeld.weldSize}</span>
              <br />
              <span className="text-muted-foreground">Sch {fieldWeld.schedule}</span>
            </div>
            {fieldWeld.welder && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{fieldWeld.welder.stencil}</div>
                  <div className="text-muted-foreground text-xs">{fieldWeld.welder.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Component Info if available */}
        {(fieldWeld.component || areaLabel !== "-" || systemLabel !== "-") && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              {fieldWeld.component ? (
                <span className="text-sm font-medium">
                  Component: {fieldWeld.component.componentId}
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  Drawing Context
                </span>
              )}
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Area: {areaLabel}</span>
                <span>System: {systemLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(() => {
          const dateWelded = fieldWeld.dateWelded;
          const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
          const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
          return (!isComplete && onMarkComplete) || (!fieldWeld.ndeResult && (onApprove || onReject));
        })() ? (
          <div className="flex gap-3 pt-3 border-t">
            {(() => {
              const dateWelded = fieldWeld.dateWelded;
              const wmMilestone = fieldWeld.component?.milestones?.find(m => m.milestoneName === "Weld");
              const isComplete = !!dateWelded || (wmMilestone?.isCompleted === true);
              return !isComplete && onMarkComplete;
            })() && (
              <Button
                size="sm"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onMarkComplete?.();
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
            {!fieldWeld.ndeResult && onApprove && (
              <Button
                size="sm"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onApprove();
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve NDE
              </Button>
            )}
            {!fieldWeld.ndeResult && onReject && (
              <Button
                size="sm"
                variant="error"
                className="flex-1 h-12"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onReject();
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject NDE
              </Button>
            )}
          </div>
        ) : null}

        {/* Comments if available */}
        {fieldWeld.comments && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span> {fieldWeld.comments}
            </p>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
