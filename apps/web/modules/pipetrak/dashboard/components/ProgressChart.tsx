"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";

interface ProgressChartProps {
	title: string;
	data: {
		label: string;
		value: number;
		count: number;
	}[];
}

export function ProgressChart({ title, data }: ProgressChartProps) {
	if (data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>No data available</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>
					Average completion by {title.toLowerCase()}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{data.map((item) => (
					<div key={item.label} className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">{item.label}</span>
							<span className="text-muted-foreground">
								{Math.round(item.value)}% ({item.count}{" "}
								components)
							</span>
						</div>
						<Progress value={item.value} className="h-2" />
					</div>
				))}
			</CardContent>
		</Card>
	);
}
