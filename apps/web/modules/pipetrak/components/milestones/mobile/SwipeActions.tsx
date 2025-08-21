"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@ui/components/button";
import { 
  CheckCircle,
  X,
  RotateCcw,
  ChevronRight
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentMilestone, ComponentWithMilestones } from "../../../types";

interface SwipeActionsProps {
  milestone: ComponentMilestone;
  component: ComponentWithMilestones;
  children: React.ReactNode;
  onUpdate: (milestoneId: string, value: boolean | number) => Promise<void>;
  onSelect: () => void;
}

type SwipeDirection = "left" | "right" | "none";

export function SwipeActions({
  milestone,
  component,
  children,
  onUpdate,
  onSelect
}: SwipeActionsProps) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>("none");
  const [isAnimating, setIsAnimating] = useState(false);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
    setIsAnimating(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      const newDirection = deltaX > 0 ? "right" : "left";
      if (newDirection !== swipeDirection) {
        setSwipeDirection(newDirection);
      }
    } else {
      if (swipeDirection !== "none") {
        setSwipeDirection("none");
      }
    }
  }, [swipeDirection]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    const deltaX = currentX.current - startX.current;
    const threshold = 100; // Increased threshold for action trigger

    if (Math.abs(deltaX) > threshold) {
      setIsAnimating(true);
      
      try {
        if (deltaX > 0) {
          // Swiped right - quick complete action
          await handleQuickComplete();
        } else {
          // Swiped left - show detail view
          onSelect();
        }
      } catch (error) {
        console.error("Swipe action failed:", error);
      }
      
      setTimeout(() => {
        setSwipeDirection("none");
        setIsAnimating(false);
      }, 300);
    } else {
      // Reset if threshold not met
      setSwipeDirection("none");
    }
  }, [onUpdate, onSelect, milestone]);

  const handleQuickComplete = async () => {
    switch (component.workflowType) {
      case "MILESTONE_DISCRETE":
        await onUpdate(milestone.id, !milestone.isCompleted);
        break;
      case "MILESTONE_PERCENTAGE":
        const newPercentage = milestone.percentageComplete === 100 ? 0 : 100;
        await onUpdate(milestone.id, newPercentage);
        break;
      case "MILESTONE_QUANTITY":
        const newQuantity = milestone.quantityComplete === milestone.quantityTotal ? 0 : (milestone.quantityTotal || 0);
        await onUpdate(milestone.id, newQuantity);
        break;
    }
  };

  const getSwipeText = () => {
    if (swipeDirection === "right") {
      return milestone.isCompleted ? "Mark Incomplete" : "Mark Complete";
    } else if (swipeDirection === "left") {
      return "Open Details";
    }
    return "";
  };

  const getSwipeIcon = () => {
    if (swipeDirection === "right") {
      return milestone.isCompleted ? <RotateCcw className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />;
    } else if (swipeDirection === "left") {
      return <ChevronRight className="h-5 w-5" />;
    }
    return null;
  };

  const getSwipeColor = () => {
    if (swipeDirection === "right") {
      return milestone.isCompleted ? "bg-orange-500" : "bg-green-500";
    } else if (swipeDirection === "left") {
      return "bg-blue-500";
    }
    return "bg-gray-500";
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background actions */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-between px-4 transition-all duration-200",
        swipeDirection !== "none" ? "opacity-100" : "opacity-0",
        getSwipeColor()
      )}>
        {/* Left action (swipe right reveals) */}
        <div className={cn(
          "flex items-center gap-2 text-white font-medium transition-transform duration-200",
          swipeDirection === "right" ? "translate-x-0" : "-translate-x-8"
        )}>
          {swipeDirection === "right" && (
            <>
              {getSwipeIcon()}
              <span>{getSwipeText()}</span>
            </>
          )}
        </div>

        {/* Right action (swipe left reveals) */}
        <div className={cn(
          "flex items-center gap-2 text-white font-medium transition-transform duration-200",
          swipeDirection === "left" ? "translate-x-0" : "translate-x-8"
        )}>
          {swipeDirection === "left" && (
            <>
              <span>{getSwipeText()}</span>
              {getSwipeIcon()}
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "relative transition-transform duration-200 ease-out",
          swipeDirection === "right" && "translate-x-2",
          swipeDirection === "left" && "-translate-x-2",
          isAnimating && "duration-300"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Swipe hint indicators (only show if no swipe in progress) */}
      {swipeDirection === "none" && !milestone.isCompleted && (
        <div className="absolute top-2 right-2 opacity-30">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}