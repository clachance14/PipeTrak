"use client";

import { memo } from "react";
import { cn } from "@ui/lib";
import { Check, Clock, Lock, AlertCircle, Loader2 } from "lucide-react";

export type MilestoneButtonState =
  | "available"    // Can be completed
  | "complete"     // Already completed
  | "blocked"      // Blocked by dependency
  | "dependent"    // Waiting for prerequisite
  | "error"        // Error state
  | "loading"      // Processing update
  | "success";     // Recently completed successfully

export interface MilestoneButtonProps {
  milestone: {
    id: string;
    milestoneName: string;
    isCompleted: boolean;
    milestoneOrder: number;
  };
  state: MilestoneButtonState;
  isSelected?: boolean;
  onClick?: (milestoneId: string) => void;
  onComplete?: (milestoneId: string) => void;
  onUncomplete?: (milestoneId: string) => void;
  className?: string;
}

export const MilestoneButton = memo(function MilestoneButton({
  milestone,
  state,
  isSelected = false,
  onClick,
  onComplete,
  onUncomplete,
  className,
}: MilestoneButtonProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (state === "loading" || state === "blocked") {
      return;
    }
    
    if (onClick) {
      onClick(milestone.id);
    } else if (state === "available" && onComplete) {
      onComplete(milestone.id);
    } else if (state === "complete" && onUncomplete) {
      onUncomplete(milestone.id);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case "complete":
      case "success":
        return <Check className="h-3 w-3" />;
      case "loading":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "blocked":
      case "dependent":
        return <Lock className="h-3 w-3" />;
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      case "available":
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "h-10 w-full min-w-[40px] flex flex-col items-center justify-center gap-0.5 p-0.5 text-xs font-medium rounded-md transition-all duration-200 active:scale-95";

    switch (state) {
      case "complete":
        return cn(
          baseStyles,
          "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200",
          isSelected && "ring-2 ring-green-500 ring-offset-1"
        );
      case "success":
        return cn(
          baseStyles,
          "bg-green-500 text-white border border-green-600 shadow-lg transform scale-105",
          "animate-pulse",
          isSelected && "ring-2 ring-green-400 ring-offset-1"
        );
      case "available":
        return cn(
          baseStyles,
          "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        );
      case "blocked":
      case "dependent":
        return cn(
          baseStyles,
          "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed",
          isSelected && "ring-2 ring-gray-400 ring-offset-1"
        );
      case "error":
        return cn(
          baseStyles,
          "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
          isSelected && "ring-2 ring-red-500 ring-offset-1"
        );
      case "loading":
        return cn(
          baseStyles,
          "bg-yellow-50 text-yellow-700 border border-yellow-200 cursor-wait",
          isSelected && "ring-2 ring-yellow-500 ring-offset-1"
        );
      default:
        return cn(
          baseStyles,
          "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100",
          isSelected && "ring-2 ring-gray-500 ring-offset-1"
        );
    }
  };

  const getAbbreviation = (name: string): string => {
    // Common milestone abbreviations for industrial construction
    const abbreviations: Record<string, string> = {
      "RECEIVE": "REC",
      "ERECT": "ERE", 
      "CONNECT": "CON",
      "SUPPORT": "SUP",
      "PUNCH": "PUN",
      "TEST": "TST",
      "RESTORE": "RES",
      "FIT": "FIT",
      "WELD": "WLD",
      "VISUAL_TEST": "VT",
      "RADIOGRAPHIC_TEST": "RT",
      "ULTRASONIC_TEST": "UT",
      "PRESSURE_TEST": "PT",
      "HYDRO_TEST": "HT",
      "INSTALL": "INS",
      "FABRICATE": "FAB",
      "ALIGN": "ALN",
      "TORQUE": "TOR",
      "INSPECT": "INS",
    };

    const upperName = name.toUpperCase();
    
    // Direct match
    if (abbreviations[upperName]) {
      return abbreviations[upperName];
    }
    
    // Partial match
    for (const [key, abbrev] of Object.entries(abbreviations)) {
      if (upperName.includes(key)) {
        return abbrev;
      }
    }
    
    // Fallback to first 3 characters or initials
    if (name.length <= 3) {
      return name.toUpperCase();
    }
    
    // If contains spaces, use initials
    if (name.includes(' ')) {
      return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 3);
    }
    
    // Use first 3 characters
    return name.slice(0, 3).toUpperCase();
  };

  const isDisabled = state === "blocked" || state === "dependent" || state === "loading" || state === "success";

  return (
    <button
      type="button"
      className={cn(getButtonStyles(), className)}
      onClick={handleClick}
      disabled={isDisabled}
      title={`${milestone.milestoneName} - ${state === "complete" ? "Completed" : state === "success" ? "Successfully updated!" : state === "blocked" ? "Blocked by dependency" : state === "dependent" ? "Waiting for prerequisite" : state === "error" ? "Error occurred" : state === "loading" ? "Processing..." : "Available"}`}
      aria-label={`Milestone ${milestone.milestoneOrder}: ${milestone.milestoneName}`}
    >
      {getButtonContent()}
      <span className="text-[10px] leading-none text-center font-semibold">
        {getAbbreviation(milestone.milestoneName)}
      </span>
    </button>
  );
});