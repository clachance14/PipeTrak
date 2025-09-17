import { Card, CardContent, CardHeader } from "@ui/components/card";
import { cn } from "@ui/lib";

interface QCMetricCardProps {
	title: string;
	value: string | number;
	label: string;
	color: "blue" | "green" | "orange" | "purple" | "teal";
	trend?: {
		value: string;
		type: "increase" | "decrease" | "neutral";
	};
	className?: string;
}

const colorMap = {
	blue: {
		dot: "bg-blue-500",
		trendBg: "bg-blue-50",
		trendText: "text-blue-600",
	},
	green: {
		dot: "bg-green-500",
		trendBg: "bg-green-50",
		trendText: "text-green-600",
	},
	orange: {
		dot: "bg-orange-500",
		trendBg: "bg-orange-50",
		trendText: "text-orange-600",
	},
	purple: {
		dot: "bg-purple-500",
		trendBg: "bg-purple-50",
		trendText: "text-purple-600",
	},
	teal: {
		dot: "bg-teal-500",
		trendBg: "bg-teal-50",
		trendText: "text-teal-600",
	},
};

const trendIcons = {
	increase: "↑",
	decrease: "↓",
	neutral: "→",
};

export function QCMetricCard({
	title,
	value,
	label,
	color,
	trend,
	className,
}: QCMetricCardProps) {
	const colors = colorMap[color];

	return (
		<Card
			className={cn(
				"relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
				className,
			)}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div className="flex items-center gap-2">
					<div className={cn("h-2.5 w-2.5 rounded-full", colors.dot)} />
					<h3 className="text-sm font-medium text-muted-foreground">
						{title}
					</h3>
				</div>
				{trend && (
					<div
						className={cn(
							"text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
							colors.trendBg,
							colors.trendText,
						)}
					>
						<span>{trendIcons[trend.type]}</span>
						{trend.value}
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-bold mb-1">{value}</div>
				<p className="text-sm text-muted-foreground">{label}</p>
			</CardContent>
		</Card>
	);
}
