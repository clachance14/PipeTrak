"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileQCView } from "./MobileQCView";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { Search, Download, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { AddWeldModal } from "./AddWeldModal";
import { MarkWeldCompleteModal } from "./MarkWeldCompleteModal";

// Types based on our API response
interface FieldWeldData {
  id: string;
  weldIdNumber: string;
  dateWelded?: string;
  weldSize: string;
  schedule: string;
  ndeResult?: string;
  pwhtRequired: boolean;
  datePwht?: string;
  comments?: string;
  packageNumber: string;
  welder?: {
    id: string;
    stencil: string;
    name: string;
  };
  drawing: {
    id: string;
    number: string;
    title: string;
  };
  weldType: {
    code: string;
    description: string;
  };
  component?: {
    id: string;
    componentId: string;
    displayId: string;
    area: string;
    system: string;
    testPackage: string;
    status: string;
    completionPercent: number;
  };
}

interface FieldWeldTableProps {
  projectId: string;
  organizationSlug: string;
}

export function FieldWeldTable({ projectId, organizationSlug }: FieldWeldTableProps) {
  const router = useRouter();
  const [data, setData] = useState<FieldWeldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWeld, setSelectedWeld] = useState<FieldWeldData | null>(null);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Natural sorting function for weld IDs
  const naturalSort = (a: any, b: any): number => {
    const aVal = a.getValue();
    const bVal = b.getValue();
    
    // Extract numeric parts for comparison
    const aNum = aVal.match(/\d+/g)?.map(Number) || [0];
    const bNum = bVal.match(/\d+/g)?.map(Number) || [0];
    
    // Compare each numeric part
    for (let i = 0; i < Math.max(aNum.length, bNum.length); i++) {
      const aDigit = aNum[i] || 0;
      const bDigit = bNum[i] || 0;
      
      if (aDigit !== bDigit) {
        return aDigit - bDigit;
      }
    }
    
    // If all numeric parts are equal, fall back to string comparison
    return aVal.localeCompare(bVal);
  };

  // Column definitions
  const columns = useMemo<ColumnDef<FieldWeldData>[]>(
    () => [
      {
        accessorKey: "weldIdNumber",
        header: "Weld ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.weldIdNumber}</div>
        ),
        sortingFn: naturalSort,
      },
      {
        accessorKey: "packageNumber",
        header: "Package",
        cell: ({ row }) => {
          const packageNumber = row.original.packageNumber;
          if (!packageNumber || packageNumber === "TBD" || packageNumber.trim() === "") {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          return <Badge status="info">{packageNumber}</Badge>;
        },
      },
      {
        accessorKey: "drawing.number",
        header: "Drawing",
        cell: ({ row }) => {
          const drawing = row.original.drawing;
          return (
            <div className="text-sm font-medium">
              {drawing.number || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "component.area",
        header: "Area",
        cell: ({ row }) => {
          const area = row.original.component?.area;
          if (!area || area.trim() === "") {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          return <Badge status="success">{area}</Badge>;
        },
      },
      {
        accessorKey: "component.system",
        header: "System",
        cell: ({ row }) => {
          const system = row.original.component?.system;
          if (!system || system.trim() === "") {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          return <Badge status="success">{system}</Badge>;
        },
      },
      {
        accessorKey: "welder.stencil",
        header: "Welder",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.welder ? (
              <>
                <div className="font-medium">{row.original.welder.stencil}</div>
                <div className="text-muted-foreground">{row.original.welder.name}</div>
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "dateWelded",
        header: "Date Welded",
        cell: ({ row }) => {
          const dateWelded = row.original.dateWelded;
          if (!dateWelded) {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          return (
            <div className="text-sm">
              {new Date(dateWelded).toLocaleDateString()}
            </div>
          );
        },
      },
      {
        accessorKey: "weldSize",
        header: "Size",
        cell: ({ row }) => {
          const weldSize = row.original.weldSize;
          const schedule = row.original.schedule;
          
          if (!weldSize && !schedule) {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          
          return (
            <div className="text-sm">
              <div>{weldSize || "-"}</div>
              <div className="text-muted-foreground">
                {schedule ? `Sch ${schedule}` : "-"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "ndeResult",
        header: "NDE Result",
        cell: ({ row }) => {
          const result = row.original.ndeResult;
          if (!result) return <Badge status="info">Pending</Badge>;
          
          const variant = 
            result === "Accept" ? "default" :
            result === "Reject" ? "destructive" :
            result === "Repair" ? "secondary" : "outline";
          
          return <Badge variant={variant}>{result}</Badge>;
        },
      },
      {
        accessorKey: "pwhtRequired",
        header: "PWHT",
        cell: ({ row }) => {
          const required = row.original.pwhtRequired;
          const completed = row.original.datePwht;
          
          if (!required) {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          
          return (
            <Badge variant={completed ? "default" : "secondary"}>
              {completed ? "Complete" : "Required"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "dateWelded",
        header: "Weld Status",
        cell: ({ row }) => {
          const isWelded = !!row.original.dateWelded;
          
          if (isWelded) {
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
          }
          
          return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">Pending</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const weld = row.original;
          const isComplete = !!weld.dateWelded;
          
          if (isComplete) {
            return <div className="text-sm text-muted-foreground">-</div>;
          }
          
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWeld(weld);
                setShowMarkCompleteModal(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Fetch data
  const fetchFieldWelds = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pipetrak/field-welds?projectId=${projectId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.fieldWelds || []);
      }
    } catch (error) {
      console.error("Failed to fetch field welds:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchFieldWelds();
  }, [projectId]);

  // Filter handlers
  const handlePackageFilter = (value: string) => {
    table.getColumn("packageNumber")?.setFilterValue(value === "all" ? undefined : value);
  };

  const handleNdeFilter = (value: string) => {
    if (value === "all") {
      table.getColumn("ndeResult")?.setFilterValue(undefined);
    } else if (value === "pending") {
      // Filter for null/undefined ndeResult
      table.getColumn("ndeResult")?.setFilterValue(null);
    } else {
      table.getColumn("ndeResult")?.setFilterValue(value);
    }
  };

  const handleAddWeld = () => {
    setShowAddModal(true);
  };

  const handleAddWeldSuccess = () => {
    fetchFieldWelds(); // Refresh data
  };

  const handleMarkCompleteSuccess = () => {
    fetchFieldWelds(); // Refresh data
    setSelectedWeld(null);
  };

  const handleImportWelds = () => {
    // Will implement import functionality
    console.log("Import welds clicked");
  };

  // Use mobile view on small screens
  if (isMobile) {
    return <MobileQCView projectId={projectId} organizationSlug={organizationSlug} />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search welds..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          
          <Select onValueChange={handlePackageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {/* Will populate with actual packages */}
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleNdeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="NDE Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Accept">Accept</SelectItem>
              <SelectItem value="Reject">Reject</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchFieldWelds} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportWelds}>
            <Download className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={handleAddWeld}>
            <Plus className="h-4 w-4 mr-2" />
            Add Weld
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      // Navigate to field weld details or open edit modal
                      console.log("Row clicked:", row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {loading ? "Loading..." : "No field welds found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} field welds
      </div>

      {/* Add Weld Modal */}
      <AddWeldModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        projectId={projectId}
        onSuccess={handleAddWeldSuccess}
      />

      {/* Mark Weld Complete Modal */}
      {selectedWeld && (
        <MarkWeldCompleteModal
          open={showMarkCompleteModal}
          onOpenChange={setShowMarkCompleteModal}
          fieldWeld={{
            id: selectedWeld.id,
            weldIdNumber: selectedWeld.weldIdNumber,
            projectId,
          }}
          onSuccess={handleMarkCompleteSuccess}
        />
      )}
    </div>
  );
}