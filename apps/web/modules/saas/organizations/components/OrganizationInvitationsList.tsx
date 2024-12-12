"use client";

import type { ActiveOrganization } from "@repo/auth";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import {
	fullOrganizationQueryKey,
	useFullOrganizationQuery,
} from "@saas/organizations/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Table, TableBody, TableCell, TableRow } from "@ui/components/table";
import { useToast } from "@ui/hooks/use-toast";
import { cn } from "@ui/lib";
import {
	CheckIcon,
	ClockIcon,
	MoreVerticalIcon,
	UndoIcon,
	XIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { OrganizationRoleSelect } from "./OrganizationRoleSelect";

export function OrganizationInvitationsList({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const formatter = useFormatter();
	const { data: organization } = useFullOrganizationQuery(organizationId);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const userOrganizationRole = organization?.members.find(
		(member) => member.userId === user?.id,
	)?.role;
	const canUserEditInvitations =
		user?.role === "admin" ||
		(userOrganizationRole && ["owner", "admin"].includes(userOrganizationRole));

	const invitations = organization?.invitations
		?.filter((invitation) => invitation.status !== "canceled")
		.sort(
			(a, b) =>
				new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
		);

	const revokeInvitation = (invitationId: string) => {
		const loadingToast = toast({
			variant: "loading",
			description: t(
				"organizations.settings.members.notifications.revokeInvitation.loading.description",
			),
		});
		authClient.organization.cancelInvitation(
			{
				invitationId,
			},
			{
				onSettled: () => {
					loadingToast.dismiss();
				},
				onSuccess: () => {
					toast({
						variant: "success",
						description: t(
							"organizations.settings.members.notifications.revokeInvitation.success.description",
						),
					});
					queryClient.invalidateQueries({
						queryKey: fullOrganizationQueryKey(organizationId),
					});
				},
				onError: () => {
					toast({
						variant: "error",
						description: t(
							"organizations.settings.members.notifications.revokeInvitation.error.description",
						),
					});
				},
			},
		);
	};

	const columns: ColumnDef<
		NonNullable<ActiveOrganization["invitations"]>[number]
	>[] = [
		{
			accessorKey: "email",
			accessorFn: (row) => row.email,
			cell: ({ row }) => {
				const InvitationStatusIcon = {
					pending: ClockIcon,
					accepted: CheckIcon,
					rejected: XIcon,
					canceled: XIcon,
				}[row.original.status];
				return (
					<div className="leading-normal">
						<strong
							className={cn("block", {
								"opacity-50": row.original.status === "canceled",
							})}
						>
							{row.original.email}
						</strong>
						<small className="flex flex-wrap gap-1 text-foreground/60">
							<span className="flex items-center gap-0.5">
								<InvitationStatusIcon className="size-3" />
								{t(
									`organizations.settings.members.invitations.invitationStatus.${row.original.status}`,
								)}
							</span>
							<span>-</span>
							<span>
								{t("organizations.settings.members.invitations.expiresAt", {
									date: formatter.dateTime(new Date(row.original.expiresAt), {
										dateStyle: "medium",
										timeStyle: "short",
									}),
								})}
							</span>
						</small>
					</div>
				);
			},
		},
		{
			accessorKey: "actions",
			cell: ({ row }) => {
				return (
					<div className="flex flex-row justify-end gap-2">
						<OrganizationRoleSelect
							value={row.original.role}
							disabled
							onSelect={() => {
								return;
							}}
						/>

						{canUserEditInvitations && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost">
										<MoreVerticalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() => revokeInvitation(row.original.id)}
									>
										<UndoIcon className="mr-2 size-4" />
										{t("organizations.settings.members.invitations.revoke")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: invitations ?? [],
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
		<div className="rounded-md border">
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
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								{t("organizations.settings.members.invitations.empty")}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
