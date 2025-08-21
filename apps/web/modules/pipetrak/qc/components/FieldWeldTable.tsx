"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
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
import { Search, Filter, Download, Plus, RefreshCw } from "lucide-react";
import { AddWeldModal } from "./AddWeldModal";

// Types based on our API response
interface FieldWeldData {
  id: string;
  weldIdNumber: string;
  dateWelded: string;
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

  // Column definitions
  const columns = useMemo<ColumnDef<FieldWeldData>[]>(
    () => [
      {
        accessorKey: "weldIdNumber",
        header: "Weld ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.weldIdNumber}</div>
        ),
      },
      {
        accessorKey: "packageNumber",
        header: "Package",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.packageNumber}</Badge>
        ),
      },
      {
        accessorKey: "drawing.number",
        header: "Drawing",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.drawing.number}</div>
            <div className="text-muted-foreground truncate max-w-[120px]">
              {row.original.drawing.title}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "component.area",
        header: "Area",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.component?.area || "N/A"}
          </Badge>
        ),
      },
      {
        accessorKey: "component.system",
        header: "System",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.component?.system || "N/A"}
          </Badge>
        ),
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
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "dateWelded",
        header: "Date Welded",
        cell: ({ row }) => (
          <div className="text-sm">
            {new Date(row.original.dateWelded).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "weldSize",
        header: "Size",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.weldSize}</div>
            <div className="text-muted-foreground">Sch {row.original.schedule}</div>
          </div>
        ),
      },
      {
        accessorKey: "ndeResult",
        header: "NDE Result",
        cell: ({ row }) => {
          const result = row.original.ndeResult;
          if (!result) return <Badge variant="outline">Pending</Badge>;
          
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
          
          if (!required) return <Badge variant="outline">N/A</Badge>;
          
          return (
            <Badge variant={completed ? "default" : "secondary"}>
              {completed ? "Complete" : "Required"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "component.status",
        header: "Install Status",
        cell: ({ row }) => {
          const status = row.original.component?.status;
          if (!status) return <Badge variant="outline">N/A</Badge>;
          
          return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
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

  const handleImportWelds = () => {
    // Will implement import functionality
    console.log("Import welds clicked");
  };

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
    </div>
  );
}