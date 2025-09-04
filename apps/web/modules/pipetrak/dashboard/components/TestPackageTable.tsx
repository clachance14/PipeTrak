"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Switch } from "@ui/components/switch";
import { Label } from "@ui/components/label";
import { Progress } from "@ui/components/progress";
import type { TestPackageReadiness, TestPackage } from "../types";

interface TestPackageTableProps {
	data: TestPackageReadiness | null;
}

function TestPackageRow({ testPackage }: { testPackage: TestPackage }) {
	return (
		<TableRow>
			<TableCell>
				<div className="font-medium">{testPackage.packageId}</div>
			</TableCell>
			<TableCell>
				<div className="max-w-[200px]">
					<div className="font-medium truncate">
						{testPackage.packageName}
					</div>
					<div className="text-xs text-muted-foreground">
						{testPackage.totalComponents} components
					</div>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-2 min-w-[120px]">
					<Progress
						value={testPackage.completionPercent}
						className="flex-1 h-2"
					/>
					<span className="text-sm font-medium min-w-[35px]">
						{testPackage.completionPercent}%
					</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-2">
					{testPackage.isReady ? (
						<Badge
							status="info"
							className="bg-green-500 hover:bg-green-600"
						>
							Ready ✓
						</Badge>
					) : (
						<Badge status="info">
							{testPackage.completedComponents}/
							{testPackage.totalComponents}
						</Badge>
					)}
					{testPackage.stalledCount > 0 && (
						<span className="text-xs text-red-500 font-medium">
							{testPackage.stalledCount} stalled
						</span>
					)}
				</div>
			</TableCell>
		</TableRow>
	);
}

export function TestPackageTable({ data }: TestPackageTableProps) {
	const [showOnlyReady, setShowOnlyReady] = useState(false);
	const [sortBy, setSortBy] = useState<"completion" | "name" | "components">(
		"completion",
	);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	const filteredAndSortedPackages = useMemo(() => {
		if (!data?.testPackages?.length) return [];

		let packages = [...data.testPackages];

		// FileFilter
		if (showOnlyReady) {
			packages = packages.filter((pkg) => pkg.isReady);
		}

		// Sort
		packages.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "completion":
					comparison = a.completionPercent - b.completionPercent;
					break;
				case "name":
					comparison = a.packageName.localeCompare(b.packageName);
					break;
				case "components":
					comparison = a.totalComponents - b.totalComponents;
					break;
			}

			return sortDirection === "desc" ? -comparison : comparison;
		});

		return packages;
	}, [data?.testPackages, showOnlyReady, sortBy, sortDirection]);

	const stats = useMemo(() => {
		if (!data?.testPackages?.length) {
			return { total: 0, ready: 0, totalStalled: 0 };
		}

		return data.testPackages.reduce(
			(acc, pkg) => ({
				total: acc.total + 1,
				ready: acc.ready + (pkg.isReady ? 1 : 0),
				totalStalled: acc.totalStalled + pkg.stalledCount,
			}),
			{ total: 0, ready: 0, totalStalled: 0 },
		);
	}, [data]);

	const handleSort = (field: typeof sortBy) => {
		if (sortBy === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortDirection("desc");
		}
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		console.log("Exporting test package data...");
	};

	if (!data?.testPackages?.length) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Test Package Readiness</CardTitle>
					<CardDescription>
						Track completion status of test packages and readiness
						indicators.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64 text-muted-foreground">
						No test packages available
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							Test Package Readiness
							<Badge status="info" className="ml-2">
								{stats.ready}/{stats.total} ready
							</Badge>
						</CardTitle>
						<CardDescription>
							{stats.total} packages, {stats.ready} ready for
							testing
							{stats.totalStalled > 0 && (
								<span className="text-red-500 ml-1">
									({stats.totalStalled} components stalled)
								</span>
							)}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={handleExport}
							className="flex items-center gap-1"
						>
							<Download className="w-4 h-4" />
							Export
						</Button>
					</div>
				</div>

				{/* FileFilters */}
				<div className="flex items-center gap-4 pt-2">
					<div className="flex items-center space-x-2">
						<Switch
							id="ready-only"
							checked={showOnlyReady}
							onCheckedChange={setShowOnlyReady}
						/>
						<Label htmlFor="ready-only" className="text-sm">
							Only Ready ({stats.ready})
						</Label>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="border rounded-lg">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("name")}
										className="flex items-center gap-1 hover:text-foreground"
									>
										Package ID
										{sortBy === "name" && (
											<span className="text-xs">
												{sortDirection === "desc"
													? "↓"
													: "↑"}
											</span>
										)}
									</button>
								</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("completion")}
										className="flex items-center gap-1 hover:text-foreground"
									>
										Progress
										{sortBy === "completion" && (
											<span className="text-xs">
												{sortDirection === "desc"
													? "↓"
													: "↑"}
											</span>
										)}
									</button>
								</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAndSortedPackages.length > 0 ? (
								filteredAndSortedPackages.map((testPackage) => (
									<TestPackageRow
										key={testPackage.packageId}
										testPackage={testPackage}
									/>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={4}
										className="text-center py-8 text-muted-foreground"
									>
										{showOnlyReady
											? "No ready test packages found"
											: "No test packages available"}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* Summary */}
				<div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
					<div>
						Showing {filteredAndSortedPackages.length} of{" "}
						{stats.total} packages
					</div>
					<div>
						{Math.round((stats.ready / stats.total) * 100)}%
						packages ready
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
