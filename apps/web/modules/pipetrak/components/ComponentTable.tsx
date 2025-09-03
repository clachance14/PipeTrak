"use client";

import { DataTable } from "../shared/components/DataTable";
import { Button } from "@ui/components/button";
import { Edit, MoreHorizontal, Target } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { TableMilestoneColumn } from "./milestones/integration/TableMilestoneColumn";
import { MilestoneUpdateEngine } from "./milestones/core/MilestoneUpdateEngine";
import { RealtimeManager } from "./milestones/realtime/RealtimeManager";
import type { ComponentWithMilestones, TableColumn } from "../types";

interface ComponentTableProps {
	components: ComponentWithMilestones[];
	loading?: boolean;
	projectId: string;
	userId: string;
	onEdit?: (component: ComponentWithMilestones) => void;
	onBulkEdit?: (componentIds: string[]) => void;
	onRowClick?: (component: ComponentWithMilestones) => void;
	onMilestoneClick?: (
		component: ComponentWithMilestones,
		milestoneId?: string,
	) => void;
	pagination?: {
		page: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	};
}

export function ComponentTable({
	components,
	loading = false,
	projectId,
	userId,
	onEdit,
	onBulkEdit: _onBulkEdit,
	onRowClick,
	onMilestoneClick,
	pagination,
}: ComponentTableProps) {
	const columns: TableColumn[] = [
		{
			key: "componentId",
			label: "Component #",
			sortable: true,
			width: "150",
		},
		{
			key: "description",
			label: "Description",
			sortable: true,
		},
		{
			key: "discipline",
			label: "Discipline",
			sortable: true,
			width: "120",
		},
		{
			key: "area",
			label: "Area",
			sortable: true,
			width: "100",
		},
		{
			key: "milestones",
			label: "Milestones",
			width: "250",
		},
		{
			key: "actions",
			label: "",
			width: "50",
		},
	];

	const tableData = components.map((component) => ({
		...component,
		milestones: (
			<TableMilestoneColumn
				component={component}
				className="max-w-[250px]"
			/>
		),
		actions: (
			<ComponentActions
				component={component}
				onEdit={() => onEdit?.(component)}
				onMilestoneClick={() => onMilestoneClick?.(component)}
			/>
		),
	}));

	return (
		<RealtimeManager projectId={projectId} userId={userId}>
			<MilestoneUpdateEngine projectId={projectId}>
				<DataTable
					columns={columns}
					data={tableData as any}
					loading={loading}
					empty={components.length === 0}
					emptyMessage="No components found. Try adjusting your filters or import some data."
					onRowClick={onRowClick}
					stickyHeader
					pagination={pagination}
				/>
			</MilestoneUpdateEngine>
		</RealtimeManager>
	);
}

function ComponentActions({
	_component,
	onEdit,
	onMilestoneClick,
}: {
	component: ComponentWithMilestones;
	onEdit: () => void;
	onMilestoneClick?: () => void;
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
				<DropdownMenuItem onClick={onMilestoneClick}>
					<Target className="mr-2 h-4 w-4" />
					View Milestones
				</DropdownMenuItem>
				<DropdownMenuItem>View History</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function _calculateProgress(component: ComponentWithMilestones): number {
	if (!component.milestones || component.milestones.length === 0) {
		return 0;
	}

	const completedCount = component.milestones.filter(
		(m) => m.isCompleted,
	).length;

	return Math.round((completedCount / component.milestones.length) * 100);
}
