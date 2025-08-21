"use client";

import { useEffect, useRef } from "react";

interface ScreenReaderAnnouncementsProps {
  children: React.ReactNode;
}

export function ScreenReaderAnnouncements({ children }: ScreenReaderAnnouncementsProps) {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const alertRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create global announcement functions
    window.announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const region = priority === 'assertive' ? alertRegionRef.current : liveRegionRef.current;
      if (region) {
        region.textContent = message;
        // Clear after a delay to allow re-announcing the same message
        setTimeout(() => {
          region.textContent = '';
        }, 1000);
      }
    };

    window.announceMilestoneUpdate = (milestoneName: string, componentId: string, newValue: string) => {
      const message = `Milestone ${milestoneName} for component ${componentId} updated to ${newValue}`;
      window.announceToScreenReader?.(message, 'polite');
    };

    window.announceBulkUpdateProgress = (completed: number, total: number) => {
      const message = `Bulk update progress: ${completed} of ${total} milestones updated`;
      window.announceToScreenReader?.(message, 'polite');
    };

    window.announceError = (error: string) => {
      window.announceToScreenReader?.(error, 'assertive');
    };

    return () => {
      // Cleanup global functions
      delete window.announceToScreenReader;
      delete window.announceMilestoneUpdate;
      delete window.announceBulkUpdateProgress;
      delete window.announceError;
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Screen reader live regions */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
      
      <div
        ref={alertRegionRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      />
    </>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    announceToScreenReader?: (message: string, priority?: 'polite' | 'assertive') => void;
    announceMilestoneUpdate?: (milestoneName: string, componentId: string, newValue: string) => void;
    announceBulkUpdateProgress?: (completed: number, total: number) => void;
    announceError?: (error: string) => void;
  }
}