"use client";

import { Badge, BadgeProps, Button, Icon, useToast } from "@components";
import { User } from "api";
import { Team, TeamMembership, TeamMembershipStatus } from "database";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components";
import { inviteTeamMemberDialogOpen } from "@lib/state/settings";
import { useSetAtom } from "jotai";
import { useState } from "react";
import InviteMemberDialog from "./InviteMemberDialog";

export default function TeamMembersList({
  team,
  memberships,
}: {
  team: Team;
  memberships: (TeamMembership & { user?: User })[];
}) {
  const t = useTranslations("settings.team.members");
  const { toast } = useToast();
  const router = useRouter();
  const setInviteMemberDialogOpen = useSetAtom(inviteTeamMemberDialogOpen);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<TeamMembership & { user?: User }>[] = [
    {
      accessorKey: "name",
      header: "Name",
      accessorFn: (row) => row.user?.name ?? "",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      accessorFn: (row) => row.user?.email ?? "",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const badgeStatuses: Record<
          TeamMembershipStatus,
          BadgeProps["status"]
        > = {
          ACCEPTED: "success",
          PENDING: "warning",
          REJECTED: "error",
        };
        const badgeLabels: Record<TeamMembershipStatus, string> = {
          ACCEPTED: "Accepted",
          PENDING: "Pending",
          REJECTED: "Rejected",
        };
        return (
          <Badge status={badgeStatuses[row.original.status]}>
            {badgeLabels[row.original.status]}
          </Badge>
        );
      },
    },
  ];

  const table = useReactTable({
    data: memberships,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="bg-card text-card-foreground border-border overflow-hidden rounded-xl border p-6">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <h2 className="mb-3 text-2xl font-semibold">{t("title")}</h2>

        <div>
          <Button size="sm" onClick={() => setInviteMemberDialogOpen(true)}>
            <Icon.plus className="mr-2 h-4 w-4" />
            {t("invite")}
          </Button>

          <InviteMemberDialog />
        </div>
      </div>

      <div className="border-border rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
