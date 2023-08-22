"use client";

import {
  Button,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components";
import { useToast } from "@ui/hooks";
import { User } from "api";
import { Team, TeamMembership } from "database";
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

import { useSetAtom } from "jotai";
import { useState } from "react";
import { inviteTeamMemberDialogOpen } from "../state";
import { InviteMemberDialog } from "./InviteMemberDialog";

export function TeamMembersList({
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

  const roleOptions = [
    {
      label: t("roles.member"),
      value: "MEMBER",
    },
    {
      label: t("roles.owner"),
      value: "OWNER",
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<TeamMembership & { user?: User }>[] = [
    {
      accessorKey: "user",
      header: "",
      accessorFn: (row) => row.user,
      cell: ({ row }) => (
        <div>
          <strong>{row.original.user?.name}</strong>
          <small>{row.original.user?.email ?? row.original.email}</small>
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        // const badgeStatuses: Record<
        //   TeamMembershipStatus,
        //   BadgeProps["status"]
        // > = {
        //   ACCEPTED: "success",
        //   PENDING: "warning",
        //   REJECTED: "error",
        // };
        // const badgeLabels: Record<TeamMembershipStatus, string> = {
        //   ACCEPTED: "Accepted",
        //   PENDING: "Pending",
        //   REJECTED: "Rejected",
        // };
        return (
          // <Badge status={badgeStatuses[row.original.status]}>
          //   {badgeLabels[row.original.status]}
          // </Badge>

          <div className="flex flex-row gap-2">
            <Select>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
