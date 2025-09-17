"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Badge } from "@ui/components/badge";
import { Columns, Eye, EyeOff, RotateCcw } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  pinnable?: boolean;
  pinned?: boolean;
}

interface ColumnToggleProps {
  columns: ColumnConfig[];
  onColumnVisibilityChange: (columnKey: string, visible: boolean) => void;
  onColumnPinChange?: (columnKey: string, pinned: boolean) => void;
  onResetColumns?: () => void;
  className?: string;
}

export function ColumnToggle({
  columns,
  onColumnVisibilityChange,
  onColumnPinChange,
  onResetColumns,
  className = "",
}: ColumnToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;
  const pinnedCount = columns.filter(col => col.pinned).length;

  const handleVisibilityToggle = (columnKey: string, checked: boolean) => {
    onColumnVisibilityChange(columnKey, checked);
  };

  const handlePinToggle = (columnKey: string, pinned: boolean) => {
    if (onColumnPinChange) {
      onColumnPinChange(columnKey, pinned);
    }
  };

  const handleShowAll = () => {
    columns.forEach(col => {
      if (!col.visible) {
        onColumnVisibilityChange(col.key, true);
      }
    });
  };

  const handleHideAll = () => {
    // Keep at least one column visible (typically the first one)
    columns.forEach((col, index) => {
      if (col.visible && index > 0) {
        onColumnVisibilityChange(col.key, false);
      }
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Columns className="h-4 w-4 mr-2" />
          Columns
          <Badge status="info" className="ml-2 text-xs">
            {visibleCount}/{totalCount}
          </Badge>
          {pinnedCount > 0 && (
            <Badge status="info" className="ml-1 text-xs">
              📌 {pinnedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Column Visibility</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="h-6 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHideAll}
              className="h-6 px-2 text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Min
            </Button>
            {onResetColumns && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetColumns}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuItem
              key={column.key}
              className="flex items-center justify-between p-2 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center space-x-3 flex-1">
                <Checkbox
                  id={`column-${column.key}`}
                  checked={column.visible}
                  onCheckedChange={(checked) => 
                    handleVisibilityToggle(column.key, checked as boolean)
                  }
                  disabled={column.key === 'weldIdNumber'} // Always keep weld ID visible
                />
                <label
                  htmlFor={`column-${column.key}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {column.label}
                </label>
              </div>
              
              {/* Pin Toggle */}
              {column.pinnable && onColumnPinChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePinToggle(column.key, !column.pinned)}
                  className={`h-6 w-6 p-0 ml-2 ${
                    column.pinned 
                      ? 'text-blue-600 hover:text-blue-700' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={column.pinned ? 'Unpin column' : 'Pin column'}
                >
                  📌
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="p-2 text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Visible: {visibleCount}/{totalCount}</span>
            {pinnedCount > 0 && <span>Pinned: {pinnedCount}</span>}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            💡 Tip: Pin important columns to keep them visible while scrolling
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to create default column configuration
export function createDefaultColumns(): ColumnConfig[] {
  return [
    { key: 'weldIdNumber', label: 'Weld ID', visible: true, pinnable: true, pinned: true },
    { key: 'packageNumber', label: 'Package', visible: true, pinnable: true },
    { key: 'drawing', label: 'Drawing', visible: true, pinnable: true },
    { key: 'area', label: 'Area', visible: true, pinnable: false },
    { key: 'system', label: 'System', visible: true, pinnable: false },
    { key: 'welder', label: 'Welder', visible: true, pinnable: false },
    { key: 'dateWelded', label: 'Date Welded', visible: true, pinnable: false },
    { key: 'weldSize', label: 'Size/Schedule', visible: true, pinnable: false },
    { key: 'xrayPercent', label: 'X-Ray %', visible: true, pinnable: false },
    { key: 'weldType', label: 'Weld Type', visible: true, pinnable: false },
    { key: 'specCode', label: 'Spec', visible: true, pinnable: false },
    { key: 'baseMetal', label: 'Base Metal', visible: true, pinnable: false },
    { key: 'ndeResult', label: 'NDE Result', visible: true, pinnable: false },
    { key: 'pwhtRequired', label: 'PWHT', visible: true, pinnable: false },
    { key: 'weldStatus', label: 'Weld Status', visible: true, pinnable: false },
    { key: 'actions', label: 'Actions', visible: true, pinnable: false },
  ];
}

// Helper function to save column configuration to localStorage
export function saveColumnConfig(columns: ColumnConfig[], storageKey = 'pipetrak-weld-columns') {
  try {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  } catch (error) {
    console.error('Failed to save column configuration:', error);
  }
}

// Helper function to load column configuration from localStorage
export function loadColumnConfig(
  defaultColumns: ColumnConfig[], 
  storageKey = 'pipetrak-weld-columns'
): ColumnConfig[] {
  // Return defaults if running on server (no window/localStorage)
  if (typeof window === 'undefined') {
    return defaultColumns;
  }
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const savedColumns = JSON.parse(saved) as ColumnConfig[];
      
      // Merge with defaults to handle new columns
      const mergedColumns = defaultColumns.map(defaultCol => {
        const savedCol = savedColumns.find(col => col.key === defaultCol.key);
        return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
      });
      
      return mergedColumns;
    }
  } catch (error) {
    console.error('Failed to load column configuration:', error);
  }
  
  return defaultColumns;
}
