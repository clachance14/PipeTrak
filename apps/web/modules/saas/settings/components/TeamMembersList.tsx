"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@ui/components";
import { ApiOutput } from "api";
import { useTranslations } from "next-intl";

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

import { UserAvatar } from "@shared/components";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { inviteTeamMemberDialogOpen } from "../state";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { TeamRoleSelect } from "./TeamRoleSelect";

type TeamMembershipsOutput = ApiOutput["team"]["memberships"];

export function TeamMembersList({
  memberships,
}: {
  memberships: TeamMembershipsOutput;
}) {
  const t = useTranslations();
  const setInviteMemberDialogOpen = useSetAtom(inviteTeamMemberDialogOpen);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<TeamMembershipsOutput[number]>[] = [
    {
      accessorKey: "user",
      header: "",
      accessorFn: (row) => row.user,
      cell: ({ row }) =>
        row.original.user ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={row.original.user.name}
              avatarUrl={row.original.user?.avatarUrl}
            />
            <div>
              <strong className="block">{row.original.user.name}</strong>
              <small className="text-muted-foreground">
                {row.original.user.email}
              </small>
            </div>
          </div>
        ) : null,
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex flex-row justify-end gap-2">
            <TeamRoleSelect
              value={row.original.role}
              onSelect={() => {}}
              disabled={row.original.isCreator}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Icon.more />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  disabled={row.original.isCreator}
                  className="text-destructive"
                  onClick={() => alert("settings.team.members.remove user")}
                >
                  <Icon.delete className="mr-2 h-4 w-4" />
                  {t("settings.team.members.removeMember")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setInviteMemberDialogOpen(true)}>
          <Icon.plus className="mr-2 h-4 w-4" />
          {t("settings.team.members.invite")}
        </Button>
      </div>

      <InviteMemberDialog />

      <div className="border-border rounded-md border">
        <Table>
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
