"use client";

import { useState, useCallback, useRef, useEffect, useMemo, forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Pin,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import type { Component, ComponentWithMilestones, TableColumn } from "../../types";

interface EnhancedDataTableProps {
  columns: TableColumn[];
  data: ComponentWithMilestones[];
  onRowClick?: (item: ComponentWithMilestones) => void;
  onCellUpdate?: (rowId: string, columnKey: string, value: any) => Promise<void>;
  onBulkUpdate?: (rowIds: string[], updates: Partial<Component>) => Promise<void>;
  className?: string;
  stickyHeader?: boolean;
  enableVirtualization?: boolean;
  enableEditing?: boolean;
  enableBulkSelection?: boolean;
  touchTargetSize?: number; // Default 52px for construction gloves
}

interface EditingCell {
  rowId: string;
  columnKey: string;
  value: any;
}

export function EnhancedDataTable({
  columns: initialColumns,
  data,
  onRowClick,
  onCellUpdate,
  onBulkUpdate,
  className,
  stickyHeader = true,
  enableVirtualization = true,
  enableEditing = true,
  enableBulkSelection = true,
  touchTargetSize = 52, // 52px for gloved hands
}: EnhancedDataTableProps) {
  // State management
  const [columns, setColumns] = useState(initialColumns);
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set(["componentId"]));
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => touchTargetSize,
    overscan: 5,
    enabled: enableVirtualization && data.length > 100,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  // Calculate displayed data
  const displayedData = useMemo(() => {
    if (enableVirtualization && data.length > 100) {
      return virtualItems.map(virtualItem => data[virtualItem.index]);
    }
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, virtualItems, enableVirtualization, page, itemsPerPage]);

  // Handle double-tap for edit mode
  const handleCellDoubleClick = useCallback((rowId: string, columnKey: string, value: any) => {
    if (!enableEditing) return;
    
    const column = columns.find(c => c.key === columnKey);
    if (column?.editable === false) return;

    setEditingCell({ rowId, columnKey, value });
    setEditValue(value?.toString() || "");
    setIsEditMode(true);
  }, [enableEditing, columns]);

  // Save cell value
  const handleSaveCell = useCallback(async () => {
    if (!editingCell || !onCellUpdate) return;

    try {
      await onCellUpdate(editingCell.rowId, editingCell.columnKey, editValue);
      toast.success("Cell updated successfully");
      setEditingCell(null);
      setIsEditMode(false);
    } catch (error) {
      toast.error("Failed to update cell");
    }
  }, [editingCell, editValue, onCellUpdate]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setIsEditMode(false);
    setEditValue("");
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;

      if (e.key === "Escape") {
        handleCancelEdit();
      } else if (e.key === "Enter") {
        handleSaveCell();
      } else if (e.key === "Tab") {
        e.preventDefault();
        // Move to next editable cell
        const currentColIndex = columns.findIndex(c => c.key === editingCell?.columnKey);
        const nextEditableCol = columns.slice(currentColIndex + 1).find(c => c.editable !== false);
        if (nextEditableCol && editingCell) {
          handleSaveCell();
          setTimeout(() => {
            handleCellDoubleClick(editingCell.rowId, nextEditableCol.key, "");
          }, 100);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, editingCell, columns, handleCancelEdit, handleSaveCell, handleCellDoubleClick]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditMode && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditMode]);

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
  };

  // Select all rows
  const toggleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(d => d.id)));
    }
  };

  // Pin/unpin column
  const toggleColumnPin = (columnKey: string) => {
    const newPinned = new Set(pinnedColumns);
    if (newPinned.has(columnKey)) {
      newPinned.delete(columnKey);
    } else {
      newPinned.add(columnKey);
    }
    setPinnedColumns(newPinned);
  };

  // Render cell content
  const renderCell = (item: ComponentWithMilestones, column: TableColumn) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.columnKey === column.key;
    const value = item[column.key as keyof ComponentWithMilestones];

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            onBlur={handleSaveCell}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveCell}
            className="h-8 w-8 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    switch (column.type) {
      case "status":
        const statusVariant = value === "COMPLETED" ? "default" : value === "IN_PROGRESS" ? "secondary" : "outline";
        return (
          <Badge
            variant={statusVariant as any}
            className="text-xs"
          >
            {value as string}
          </Badge>
        );
      case "progress":
        const percent = value as number || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-muted rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  percent === 100 ? "bg-fieldComplete" : percent > 0 ? "bg-blue-600" : "bg-fieldPending"
                )}
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            <span className="text-sm font-medium min-w-[3rem]">
              {Math.round(percent)}%
            </span>
          </div>
        );
      default:
        return (
          <div
            className={cn(
              "flex items-center",
              enableEditing && column.editable !== false && "cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
            )}
            style={{ minHeight: `${touchTargetSize}px` }}
            onDoubleClick={() => handleCellDoubleClick(item.id, column.key, value)}
          >
            {value?.toString() || "-"}
            {enableEditing && column.editable !== false && (
              <Edit2 className="ml-2 h-3 w-3 opacity-0 hover:opacity-50" />
            )}
          </div>
        );
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {enableBulkSelection && selectedRows.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2">
          <span className="text-sm font-medium">
            {selectedRows.size} row{selectedRows.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onBulkUpdate) {
                  onBulkUpdate(Array.from(selectedRows), { status: "IN_PROGRESS" as any });
                }
              }}
            >
              Mark In Progress
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onBulkUpdate) {
                  onBulkUpdate(Array.from(selectedRows), { status: "COMPLETED" as any });
                }
              }}
            >
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedRows(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ maxHeight: enableVirtualization && data.length > 100 ? "600px" : "auto" }}
      >
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10 shadow-sm")}>
            <TableRow>
              {enableBulkSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === data.length}
                    onCheckedChange={toggleSelectAll}
                    className="h-5 w-5"
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ 
                    width: column.width,
                    minHeight: `${touchTargetSize}px`,
                    left: pinnedColumns.has(column.key) ? 0 : undefined,
                    position: pinnedColumns.has(column.key) ? "sticky" : undefined,
                    background: pinnedColumns.has(column.key) ? "inherit" : undefined,
                    zIndex: pinnedColumns.has(column.key) ? 11 : undefined,
                  }}
                  className={cn(
                    "relative group",
                    pinnedColumns.has(column.key) && "shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => toggleColumnPin(column.key)}
                    >
                      <Pin className={cn(
                        "h-3 w-3",
                        pinnedColumns.has(column.key) && "fill-current"
                      )} />
                    </Button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {enableVirtualization && data.length > 100 ? (
              <>
                {virtualItems.length > 0 && (
                  <tr>
                    <td colSpan={columns.length + (enableBulkSelection ? 1 : 0)} style={{ height: virtualItems[0].start }} />
                  </tr>
                )}
                {virtualItems.map((virtualItem) => {
                  const item = data[virtualItem.index];
                  return (
                    <TableRow
                      key={item.id}
                      data-index={virtualItem.index}
                      className={cn(
                        "hover:bg-muted/50",
                        selectedRows.has(item.id) && "bg-muted/30"
                      )}
                      style={{ height: `${virtualItem.size}px` }}
                    >
                      {enableBulkSelection && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(item.id)}
                            onCheckedChange={() => toggleRowSelection(item.id)}
                            className="h-5 w-5"
                            aria-label={`Select ${item.componentId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          style={{
                            left: pinnedColumns.has(column.key) ? 0 : undefined,
                            position: pinnedColumns.has(column.key) ? "sticky" : undefined,
                            background: pinnedColumns.has(column.key) ? "inherit" : undefined,
                            zIndex: pinnedColumns.has(column.key) ? 10 : undefined,
                          }}
                          className={cn(
                            pinnedColumns.has(column.key) && "shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                          )}
                        >
                          {renderCell(item, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </>
            ) : (
              displayedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/50",
                    selectedRows.has(item.id) && "bg-muted/30"
                  )}
                  style={{ minHeight: `${touchTargetSize}px` }}
                  onClick={() => !isEditMode && onRowClick?.(item)}
                >
                  {enableBulkSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(item.id)}
                        onCheckedChange={() => toggleRowSelection(item.id)}
                        className="h-5 w-5"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${item.componentId}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      style={{
                        left: pinnedColumns.has(column.key) ? 0 : undefined,
                        position: pinnedColumns.has(column.key) ? "sticky" : undefined,
                        background: pinnedColumns.has(column.key) ? "inherit" : undefined,
                        zIndex: pinnedColumns.has(column.key) ? 10 : undefined,
                      }}
                      className={cn(
                        pinnedColumns.has(column.key) && "shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!enableVirtualization && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({data.length} total items)
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit mode indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary text-primary-foreground px-4 py-2 shadow-lg">
          <p className="text-sm font-medium">Edit Mode Active</p>
          <p className="text-xs opacity-90">Press ESC to cancel, Enter to save</p>
        </div>
      )}
    </div>
  );
}