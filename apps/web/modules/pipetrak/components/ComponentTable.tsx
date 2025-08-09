"use client";

import { DataTable } from "../shared/components/DataTable";
import { Button } from "@ui/components/button";
import { Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import type { Component, TableColumn } from "../types";

interface ComponentTableProps {
  components: Component[];
  loading?: boolean;
  onEdit?: (component: Component) => void;
  onBulkEdit?: (componentIds: string[]) => void;
  onRowClick?: (component: Component) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function ComponentTable({
  components,
  loading = false,
  onEdit,
  onBulkEdit,
  onRowClick,
  pagination,
}: ComponentTableProps) {
  const columns: TableColumn[] = [
    {
      key: 'componentNumber',
      label: 'Component #',
      sortable: true,
      width: 150,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'discipline',
      label: 'Discipline',
      sortable: true,
      width: 120,
    },
    {
      key: 'area',
      label: 'Area',
      sortable: true,
      width: 100,
    },
    {
      key: 'progress',
      label: 'Progress',
      type: 'progress',
      width: 150,
    },
    {
      key: 'actions',
      label: '',
      width: 50,
    },
  ];

  const tableData = components.map(component => ({
    ...component,
    progress: calculateProgress(component),
    actions: (
      <ComponentActions 
        component={component}
        onEdit={() => onEdit?.(component)}
      />
    ),
  }));

  return (
    <DataTable
      columns={columns}
      data={tableData}
      loading={loading}
      empty={components.length === 0}
      emptyMessage="No components found. Try adjusting your filters or import some data."
      onRowClick={onRowClick}
      stickyHeader
      pagination={pagination}
    />
  );
}

function ComponentActions({ 
  component, 
  onEdit 
}: { 
  component: Component; 
  onEdit: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Component
        </DropdownMenuItem>
        <DropdownMenuItem>
          View Milestones
        </DropdownMenuItem>
        <DropdownMenuItem>
          View History
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function calculateProgress(component: Component): number {
  if (!component.milestones || component.milestones.length === 0) {
    return 0;
  }

  const completedCount = component.milestones.filter(
    m => m.status === 'COMPLETED'
  ).length;

  return Math.round((completedCount / component.milestones.length) * 100);
}