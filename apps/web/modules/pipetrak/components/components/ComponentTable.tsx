"use client";

import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ColumnSizingState,
  ColumnOrderState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ComponentCard } from "./ComponentCard";
import { MobileComponentCard } from "./MobileComponentCard";
import { MobileDrawingGroup } from "./MobileDrawingGroup";
import { DrawingGroup } from "./DrawingGroup";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { MilestoneUpdateModal } from "./MilestoneUpdateModal";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/components/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@ui/components/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit2,
  Check,
  X,
  Columns,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@ui/lib";
import { useRouter } from "next/navigation";
import type { Component, ComponentWithMilestones } from "../../types";
import { apiClient } from "@shared/lib/api-client";

interface ComponentTableProps {
  components: ComponentWithMilestones[];
  projectId: string;
}

// Editable cell component for inline editing
function EditableCell({ 
  getValue, 
  row, 
  column, 
  table 
}: {
  getValue: () => any;
  row: any;
  column: any;
  table: any;
}) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      table.options.meta?.updateData(row.index, column.id, value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
      />
    );
  }

  const displayValue = value || '-';
  const shouldTruncate = column.id !== 'description' && displayValue.length > 20;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onDoubleClick={() => setIsEditing(true)}
            className="w-full h-full flex items-center px-2 cursor-text hover:bg-gray-50 text-sm"
          >
            <span className={shouldTruncate ? "truncate" : ""}>
              {displayValue}
            </span>
          </div>
        </TooltipTrigger>
        {displayValue !== '-' && (
          <TooltipContent>
            <p>{displayValue}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Status cell with color coding
function StatusCell({ getValue }: { getValue: () => any }) {
  const status = getValue();
  
  const statusConfig = {
    NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: '○' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: '◐' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: '●' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_STARTED;

  return (
    <div className="flex items-center gap-2 px-2">
      <span className={cn("text-lg", config.color.split(' ')[1])}>{config.icon}</span>
      <Badge className={cn("font-medium", config.color)}>
        {config.label}
      </Badge>
    </div>
  );
}

// Progress cell with visual bar
function ProgressCell({ getValue }: { getValue: () => any }) {
  const progress = getValue() || 0;
  
  return (
    <div className="flex items-center gap-2 px-2 w-full">
      <Progress value={progress} className="h-2 flex-1" />
      <span className="text-sm font-medium w-12 text-right">{progress}%</span>
    </div>
  );
}

export function ComponentTable({ components: initialComponents, projectId }: ComponentTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialComponents);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'drawingNumber', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // Initialize with empty state to avoid hydration mismatch
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [mobileSelectedIds, setMobileSelectedIds] = useState<Set<string>>(new Set());
  const [expandedDrawings, setExpandedDrawings] = useState<Set<string>>(new Set());
  
  // Default column IDs in the order they appear
  const defaultColumnIds = [
    'select',
    'drawingNumber', 
    'componentId',
    'type',
    'size',
    'spec',
    'material',
    'description',
    'area',
    'system',
    'testPackage',
    'status',
    'completionPercent'
  ];
  
  // Column ordering state - initialize with default order
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaultColumnIds);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);

  // Filter states
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterSystem, setFilterSystem] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDrawing, setFilterDrawing] = useState<string>("all");

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedSizesRef = useRef(false);

  // Detect mobile viewport and adjust column visibility
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // Responsive column hiding
      const newVisibility: VisibilityState = {};
      if (width < 1024) {
        // Hide less critical columns on smaller screens
        newVisibility.spec = false;
        newVisibility.material = false;
        newVisibility.type = false;
        newVisibility.size = false;
      } else if (width < 1400) {
        // Hide only spec and material on medium screens
        newVisibility.spec = false;
        newVisibility.material = false;
      }
      
      setColumnVisibility(prev => ({
        ...prev,
        ...newVisibility
      }));
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load saved column sizes, order, and expanded drawings from localStorage after mount
  useEffect(() => {
    const savedSizes = localStorage.getItem('pipetrak-column-sizes');
    if (savedSizes) {
      try {
        const parsed = JSON.parse(savedSizes);
        setColumnSizing(parsed);
      } catch (e) {
        console.error('Failed to parse saved column sizes:', e);
      }
    }
    
    const savedOrder = localStorage.getItem('pipetrak-column-order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setColumnOrder(parsed);
      } catch (e) {
        console.error('Failed to parse saved column order:', e);
      }
    }
    
    const savedExpanded = localStorage.getItem('pipetrak-expanded-drawings');
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded);
        setExpandedDrawings(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse saved expanded drawings:', e);
      }
    }
    
    hasLoadedSizesRef.current = true;
  }, []); // Only run once on mount

  // Save column sizes to localStorage when they change (only after initial load)
  useEffect(() => {
    // Skip saving on initial mount or if sizes haven't been loaded yet
    if (!hasLoadedSizesRef.current) return;
    
    if (Object.keys(columnSizing).length > 0) {
      localStorage.setItem('pipetrak-column-sizes', JSON.stringify(columnSizing));
    }
  }, [columnSizing]);
  
  // Save column order to localStorage when it changes
  useEffect(() => {
    // Skip saving on initial mount or if sizes haven't been loaded yet
    if (!hasLoadedSizesRef.current) return;
    
    if (columnOrder.length > 0) {
      localStorage.setItem('pipetrak-column-order', JSON.stringify(columnOrder));
    }
  }, [columnOrder]);
  
  // Save expanded drawings to localStorage when they change
  useEffect(() => {
    if (!hasLoadedSizesRef.current) return;
    
    localStorage.setItem('pipetrak-expanded-drawings', JSON.stringify(Array.from(expandedDrawings)));
  }, [expandedDrawings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F key or F11 for full-screen toggle
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Only toggle if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsFullScreen(prev => !prev);
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsFullScreen(prev => !prev);
      } else if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Define columns with drawing leftmost
  const columns = useMemo<ColumnDef<ComponentWithMilestones>[]>(
    () => [
      // Selection column
      {
        id: 'select',
        size: 50,
        minSize: 40,
        maxSize: 60,
        enableResizing: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4"
          />
        ),
      },
      // Drawing column - PRIMARY CONTEXT (leftmost)
      {
        accessorKey: 'drawingNumber',
        size: 180,
        minSize: 120,
        maxSize: 300,
        header: ({ column }) => (
          <div className="flex items-center gap-1 font-semibold">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>ISO/Drawing</span>
            <button
              onClick={() => column.toggleSorting()}
              className="hover:bg-gray-200 p-1 rounded ml-auto"
            >
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronsUpDown className="h-4 w-4" />
              )}
            </button>
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string || '-';
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium text-[15px] text-blue-900 px-2 break-all">
                    {value}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{value}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        enableSorting: true,
      },
      // Component ID (second frozen column)
      {
        accessorKey: 'componentId',
        size: 250,
        minSize: 180,
        maxSize: 400,
        header: 'Component ID',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-mono font-bold text-[15px] text-gray-900 px-2 break-all">
                    {value}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{value}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        enableSorting: true,
      },
      // Type
      {
        accessorKey: 'type',
        header: 'Type',
        cell: EditableCell,
        size: 100,
        minSize: 60,
        maxSize: 150,
        enableSorting: true,
      },
      // Size
      {
        accessorKey: 'size',
        header: 'Size',
        cell: EditableCell,
        size: 80, // Reduced from 100
        enableSorting: true,
      },
      // Spec
      {
        accessorKey: 'spec',
        header: 'Spec',
        cell: EditableCell,
        size: 100, // Reduced from 120
        enableSorting: true,
      },
      // Material
      {
        accessorKey: 'material',
        header: 'Material',
        cell: EditableCell,
        size: 100, // Reduced from 130
        enableSorting: true,
      },
      // Description
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ getValue, row, column, table }) => {
          const initialValue = getValue();
          const [value, setValue] = useState(initialValue);
          const [isEditing, setIsEditing] = useState(false);
          const inputRef = useRef<HTMLInputElement>(null);

          const onBlur = () => {
            setIsEditing(false);
            if (value !== initialValue) {
              table.options.meta?.updateData(row.index, column.id, value);
            }
          };

          const onKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              onBlur();
            } else if (e.key === 'Escape') {
              setValue(initialValue);
              setIsEditing(false);
            }
          };

          useEffect(() => {
            if (isEditing && inputRef.current) {
              inputRef.current.focus();
              inputRef.current.select();
            }
          }, [isEditing]);

          useEffect(() => {
            setValue(initialValue);
          }, [initialValue]);

          if (isEditing) {
            return (
              <input
                ref={inputRef}
                value={value as string || ''}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
              />
            );
          }

          const displayValue = value as string || '-';
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    onDoubleClick={() => setIsEditing(true)}
                    className="w-full min-h-[52px] flex items-center px-2 cursor-text hover:bg-gray-50 text-sm whitespace-normal leading-snug"
                  >
                    {displayValue}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{displayValue}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        size: 350, // Increased from 250
        enableSorting: false,
      },
      // Area
      {
        accessorKey: 'area',
        header: 'Area',
        cell: EditableCell,
        size: 80, // Reduced from 100
        enableSorting: true,
      },
      // System
      {
        accessorKey: 'system',
        header: 'System',
        cell: EditableCell,
        size: 100, // Reduced from 120
        enableSorting: true,
      },
      // Test Package
      {
        accessorKey: 'testPackage',
        header: 'Test Pkg',
        cell: EditableCell,
        size: 100, // Reduced from 130
        enableSorting: true,
      },
      // Status
      {
        accessorKey: 'status',
        header: 'Status',
        cell: StatusCell,
        size: 130, // Reduced from 140
        enableSorting: true,
      },
      // Progress
      {
        accessorKey: 'completionPercent',
        header: 'Progress',
        cell: ProgressCell,
        size: 140, // Reduced from 160
        enableSorting: true,
      },
    ],
    []
  );

  // Extract unique values for filters
  const areas = useMemo(() => {
    const uniqueAreas = new Set(data.map(c => c.area).filter(Boolean));
    return Array.from(uniqueAreas).sort();
  }, [data]);

  const systems = useMemo(() => {
    const uniqueSystems = new Set(data.map(c => c.system).filter(Boolean));
    return Array.from(uniqueSystems).sort();
  }, [data]);

  const drawings = useMemo(() => {
    const uniqueDrawings = new Set(data.map(c => c.drawingNumber).filter(Boolean));
    return Array.from(uniqueDrawings).sort();
  }, [data]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply dropdown filters
    if (filterArea !== "all") {
      filtered = filtered.filter(c => c.area === filterArea);
    }
    if (filterSystem !== "all") {
      filtered = filtered.filter(c => c.system === filterSystem);
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    if (filterDrawing !== "all") {
      filtered = filtered.filter(c => c.drawingNumber === filterDrawing);
    }

    // Apply global search
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter(component => {
        return (
          component.componentId?.toLowerCase().includes(search) ||
          component.type?.toLowerCase().includes(search) ||
          component.description?.toLowerCase().includes(search) ||
          component.spec?.toLowerCase().includes(search) ||
          component.material?.toLowerCase().includes(search) ||
          component.drawingNumber?.toLowerCase().includes(search) ||
          component.area?.toLowerCase().includes(search) ||
          component.system?.toLowerCase().includes(search)
        );
      });
    }

    return filtered;
  }, [data, filterArea, filterSystem, filterStatus, filterDrawing, globalFilter]);

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    meta: {
      updateData: async (rowIndex: number, columnId: string, value: any) => {
        const component = filteredData[rowIndex];
        if (!component) return;

        try {
          // Call API to update component
          const response = await apiClient.pipetrak.components[":id"].$patch({
            param: { id: component.id },
            json: { [columnId]: value }
          });

          if (!response.ok) {
            throw new Error("Failed to update component");
          }

          // Update local state
          setData(old =>
            old.map((row, index) => {
              if (row.id === component.id) {
                return {
                  ...row,
                  [columnId]: value,
                };
              }
              return row;
            })
          );

          toast.success("Component updated");
        } catch (error) {
          console.error("Error updating component:", error);
          toast.error("Failed to update component");
        }
      },
    },
  });

  // Virtualization setup
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 65, // Fixed height for all rows
    overscan: 5,
    measureElement: undefined, // Use fixed sizing
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Handle export
  const handleExport = async () => {
    try {
      const headers = columns
        .filter(c => c.id !== 'select')
        .map(c => c.header)
        .join(",");
      
      const rows = filteredData.map(component => 
        columns
          .filter(c => c.id !== 'select')
          .map(col => {
            const value = component[col.id as keyof ComponentWithMilestones];
            return typeof value === "string" && value.includes(",") 
              ? `"${value}"` 
              : value?.toString() || "";
          }).join(",")
      );
      
      const csv = [headers, ...rows].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `components-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Components exported successfully");
    } catch (error) {
      console.error("Error exporting components:", error);
      toast.error("Failed to export components");
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    startTransition(async () => {
      try {
        const response = await apiClient.pipetrak.components.$get({
          query: { projectId }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch components");
        }

        const result = await response.json();
        setData(result.data || []);
        toast.success("Components refreshed");
      } catch (error) {
        console.error("Error refreshing components:", error);
        toast.error("Failed to refresh components");
      }
    });
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error("No components selected");
      return;
    }

    setShowBulkUpdateModal(true);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const notStarted = filteredData.filter(c => c.status === "NOT_STARTED").length;
    const inProgress = filteredData.filter(c => c.status === "IN_PROGRESS").length;
    const completed = filteredData.filter(c => c.status === "COMPLETED").length;
    const avgProgress = filteredData.reduce((sum, c) => sum + (c.completionPercent || 0), 0) / total || 0;

    return { total, notStarted, inProgress, completed, avgProgress };
  }, [filteredData]);

  // Column reordering helper functions
  const reorderColumn = (
    draggedColumnId: string,
    targetColumnId: string,
    columnOrder: string[]
  ): ColumnOrderState => {
    const newColumnOrder = [...columnOrder];
    const fromIndex = newColumnOrder.indexOf(draggedColumnId);
    const toIndex = newColumnOrder.indexOf(targetColumnId);
    
    if (fromIndex !== -1 && toIndex !== -1) {
      newColumnOrder.splice(fromIndex, 1);
      newColumnOrder.splice(toIndex, 0, draggedColumnId);
    }
    
    return newColumnOrder;
  };

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    // Don't allow dragging of select column or frozen columns
    if (columnId === 'select' || columnId === 'drawingNumber' || columnId === 'componentId') {
      e.preventDefault();
      return;
    }
    
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
    // Add a dummy data to make drag work in all browsers
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setTargetColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (columnId: string) => {
    // Don't allow dropping on select column or frozen columns
    if (columnId === 'select' || columnId === 'drawingNumber' || columnId === 'componentId') {
      return;
    }
    setTargetColumn(columnId);
  };

  const handleDragLeave = () => {
    // Clear target when leaving a column
    setTargetColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    // Don't allow dropping on select column or frozen columns
    if (columnId === 'select' || columnId === 'drawingNumber' || columnId === 'componentId') {
      setDraggedColumn(null);
      setTargetColumn(null);
      return;
    }
    
    if (draggedColumn && draggedColumn !== columnId) {
      // Get current column order or use default
      const currentOrder = columnOrder.length > 1 
        ? columnOrder 
        : defaultColumnIds;
      
      const newOrder = reorderColumn(
        draggedColumn,
        columnId,
        currentOrder
      );
      
      setColumnOrder(newOrder);
      toast.success(`Column order updated`);
    }
    
    setDraggedColumn(null);
    setTargetColumn(null);
  };

  // Bulk update handler
  const handleBulkUpdateSubmit = async (updates: any) => {
    const selectedRows = isMobile 
      ? filteredData.filter(c => mobileSelectedIds.has(c.id))
      : table.getFilteredSelectedRowModel().rows.map(r => r.original);
    
    // TODO: Make actual API calls to update components
    for (const component of selectedRows) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update local state
        setData(prev => prev.map(c => 
          c.id === component.id ? { ...c, ...updates } : c
        ));
      } catch (error) {
        console.error(`Failed to update component ${component.id}:`, error);
      }
    }
    
    // Clear selections
    if (isMobile) {
      setMobileSelectedIds(new Set());
    } else {
      setRowSelection({});
    }
  };

  // Group components by drawing number for all views
  const componentsByDrawing = useMemo(() => {
    const groups = new Map<string, ComponentWithMilestones[]>();
    
    filteredData.forEach(component => {
      const drawingKey = component.drawingNumber || 'NO_DRAWING';
      if (!groups.has(drawingKey)) {
        groups.set(drawingKey, []);
      }
      groups.get(drawingKey)!.push(component);
    });
    
    // Sort drawings alphabetically
    return new Map([...groups.entries()].sort((a, b) => {
      // Put "NO_DRAWING" at the end
      if (a[0] === 'NO_DRAWING') return 1;
      if (b[0] === 'NO_DRAWING') return -1;
      return a[0].localeCompare(b[0]);
    }));
  }, [filteredData]);

  // Mobile view with drawing groups
  if (isMobile) {
    const selectedComponents = filteredData.filter(c => mobileSelectedIds.has(c.id));
    
    const toggleDrawing = (drawingNumber: string) => {
      const newExpanded = new Set(expandedDrawings);
      if (newExpanded.has(drawingNumber)) {
        newExpanded.delete(drawingNumber);
      } else {
        newExpanded.add(drawingNumber);
      }
      setExpandedDrawings(newExpanded);
    };
    
    const toggleAllDrawings = () => {
      if (expandedDrawings.size === componentsByDrawing.size) {
        // All expanded, collapse all
        setExpandedDrawings(new Set());
      } else {
        // Some or none expanded, expand all
        setExpandedDrawings(new Set(componentsByDrawing.keys()));
      }
    };
    
    const handleSelectAllInDrawing = (componentIds: string[], selected: boolean) => {
      const newSelection = new Set(mobileSelectedIds);
      if (selected) {
        componentIds.forEach(id => newSelection.add(id));
      } else {
        componentIds.forEach(id => newSelection.delete(id));
      }
      setMobileSelectedIds(newSelection);
    };
    
    return (
      <>
        <div className="space-y-4 pb-20">
          {/* Mobile header with search and bulk actions */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search components..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleAllDrawings}
                  title={expandedDrawings.size === componentsByDrawing.size ? "Collapse All" : "Expand All"}
                >
                  {expandedDrawings.size === componentsByDrawing.size ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Bulk actions bar */}
              {mobileSelectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                  <span className="text-sm font-medium">
                    {mobileSelectedIds.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMobileSelectedIds(new Set())}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowBulkUpdateModal(true)}
                    >
                      Bulk Update
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMilestoneModal(true)}
                    >
                      Milestones
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Drawings</p>
                <p className="text-lg font-bold">{componentsByDrawing.size}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Components</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Complete</p>
                <p className="text-lg font-bold">{stats.complete}</p>
              </CardContent>
            </Card>
          </div>

          {/* Drawing groups */}
          <div className="space-y-4">
            {Array.from(componentsByDrawing.entries()).map(([drawingNumber, components]) => (
              <MobileDrawingGroup
                key={drawingNumber}
                drawingNumber={drawingNumber === 'NO_DRAWING' ? '' : drawingNumber}
                components={components}
                isExpanded={expandedDrawings.has(drawingNumber)}
                onToggleExpand={() => toggleDrawing(drawingNumber)}
                selectedIds={mobileSelectedIds}
                onSelectComponent={(componentId, selected) => {
                  const newSelection = new Set(mobileSelectedIds);
                  if (selected) {
                    newSelection.add(componentId);
                  } else {
                    newSelection.delete(componentId);
                  }
                  setMobileSelectedIds(newSelection);
                }}
                onSelectAll={handleSelectAllInDrawing}
                onComponentClick={(componentId) => {
                  router.push(`/app/pipetrak/${projectId}/components/${componentId}`);
                }}
                onQuickUpdate={(componentId, status) => {
                  setData(prev => prev.map(c => 
                    c.id === componentId ? { ...c, status } : c
                  ));
                  toast.success("Status updated");
                }}
                onEdit={(componentId) => {
                  router.push(`/app/pipetrak/${projectId}/components/${componentId}/edit`);
                }}
              />
            ))}
          </div>

          {/* Mobile floating action button for filters */}
          <Button
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={() => {
              // TODO: Show filter modal
              toast.info("Filter modal coming soon");
            }}
          >
            <Filter className="h-6 w-6" />
          </Button>
        </div>

        {/* Bulk Update Modal */}
        <BulkUpdateModal
          isOpen={showBulkUpdateModal}
          onClose={() => setShowBulkUpdateModal(false)}
          selectedComponents={selectedComponents}
          onUpdate={handleBulkUpdateSubmit}
        />
        
        {/* Milestone Update Modal */}
        <MilestoneUpdateModal
          components={selectedComponents}
          isOpen={showMilestoneModal}
          onClose={() => setShowMilestoneModal(false)}
          onUpdate={() => {
            // Refresh data after milestone updates
            handleRefresh();
          }}
          isMobile={true}
        />
      </>
    );
  }

  // Desktop view with full-screen support
  const tableContent = (
    <div className={cn(
      "space-y-6",
      isFullScreen && "h-full flex flex-col"
    )}>
      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isPending}
            >
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            </Button>
          </div>

          <div className="flex gap-2">
            {Object.keys(rowSelection).length > 0 && (
              <>
                <Button variant="default" size="sm" onClick={handleBulkUpdate}>
                  Bulk Update ({Object.keys(rowSelection).length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowMilestoneModal(true)}
                >
                  Update Milestones ({Object.keys(rowSelection).length})
                </Button>
              </>
            )}
            
            {/* Column visibility dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">Column Visibility</div>
                {table
                  .getAllColumns()
                  .filter(column => 
                    column.getCanHide() && 
                    !['select', 'drawingNumber', 'componentId'].includes(column.id)
                  )
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === 'testPackage' ? 'Test Package' : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                <div className="border-t mt-2 pt-2">
                  <DropdownMenuItem
                    onClick={() => {
                      // Reset all column sizes
                      table.resetColumnSizing();
                      localStorage.removeItem('pipetrak-column-sizes');
                      toast.success("Column widths reset to defaults");
                    }}
                  >
                    Reset Column Widths
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // Reset column order
                      setColumnOrder([]);
                      localStorage.removeItem('pipetrak-column-order');
                      toast.success("Column order reset to defaults");
                    }}
                  >
                    Reset Column Order
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/app/pipetrak/${projectId}/import`)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            
            {/* Full-screen toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit full-screen (Esc)" : "Full-screen (F)"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterDrawing} onValueChange={setFilterDrawing}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Drawings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drawings</SelectItem>
              {drawings.map(drawing => (
                <SelectItem key={drawing} value={drawing || ""}>
                  {drawing}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area || ""}>
                  Area {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systems.map(system => (
                <SelectItem key={system} value={system || ""}>
                  {system}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats - Hide in full-screen mode */}
      {!isFullScreen && (
        <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Components</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Not Started</p>
            <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Progress</p>
            <p className="text-2xl font-bold">{Math.round(stats.avgProgress)}%</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Drawing Groups */}
      <div className={cn(
        "space-y-4",
        isFullScreen && "flex-1 overflow-auto"
      )}>
        {/* Expand/Collapse All */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {componentsByDrawing.size} Drawing{componentsByDrawing.size !== 1 ? 's' : ''}
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (expandedDrawings.size === componentsByDrawing.size) {
                setExpandedDrawings(new Set());
              } else {
                setExpandedDrawings(new Set(componentsByDrawing.keys()));
              }
            }}
          >
            {expandedDrawings.size === componentsByDrawing.size ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Expand All
              </>
            )}
          </Button>
        </div>
        
        {/* Drawing groups */}
        <div className="space-y-4">
          {Array.from(componentsByDrawing.entries()).map(([drawingNumber, components]) => (
            <DrawingGroup
              key={drawingNumber}
              drawingNumber={drawingNumber === 'NO_DRAWING' ? '' : drawingNumber}
              components={components}
              isExpanded={expandedDrawings.has(drawingNumber)}
              onToggleExpand={() => {
                const newExpanded = new Set(expandedDrawings);
                if (newExpanded.has(drawingNumber)) {
                  newExpanded.delete(drawingNumber);
                } else {
                  newExpanded.add(drawingNumber);
                }
                setExpandedDrawings(newExpanded);
              }}
              columns={columns}
              columnOrder={columnOrder}
              columnSizing={columnSizing}
              columnVisibility={columnVisibility}
              rowSelection={rowSelection}
              onRowSelectionChange={(componentIds, selected) => {
                const newSelection = { ...rowSelection };
                if (selected) {
                  componentIds.forEach(id => {
                    newSelection[id] = true;
                  });
                } else {
                  componentIds.forEach(id => {
                    delete newSelection[id];
                  });
                }
                setRowSelection(newSelection);
              }}
              onComponentUpdate={(componentId, field, value) => {
                setData(prev => prev.map(c => 
                  c.id === componentId ? { ...c, [field]: value } : c
                ));
              }}
              draggedColumn={draggedColumn}
              targetColumn={targetColumn}
              onDragStart={setDraggedColumn}
              onDragOver={setTargetColumn}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // If full-screen, render with portal-like behavior
  if (isFullScreen) {
    return (
      <div 
        ref={fullScreenContainerRef}
        className="fixed inset-0 z-50 bg-white flex flex-col"
      >
        {/* Full-screen header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Component Table - Full Screen</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(false)}
            className="gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            Exit Full Screen (Esc)
          </Button>
        </div>
        {/* Table content fills remaining space - with scroll */}
        <div className="flex-1 overflow-auto p-4">
          {tableContent}
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <>
      {tableContent}
      
      {/* Bulk Update Modal for desktop */}
      <BulkUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        selectedComponents={table.getFilteredSelectedRowModel().rows.map(r => r.original)}
        onUpdate={handleBulkUpdateSubmit}
      />
      
      {/* Milestone Update Modal for desktop */}
      <MilestoneUpdateModal
        components={table.getFilteredSelectedRowModel().rows.map(r => r.original)}
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        onUpdate={() => {
          // Refresh data after milestone updates
          handleRefresh();
        }}
        isMobile={false}
      />
    </>
  );
}