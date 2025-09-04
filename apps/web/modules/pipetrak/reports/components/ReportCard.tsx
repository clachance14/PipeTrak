import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	ArrowRight,
	Clock,
	FileText,
	BarChart3,
	CheckCircle22,
	TrendingUp,
	Shield,
	Zap,
} from "lucide-react";
import { cn } from "@ui/lib";

interface ReportCardProps {
	title: string;
	description: string;
	href: string;
	icon: "progress" | "components" | "test-packages" | "trends" | "audit";
	badge?: string;
	isNew?: boolean;
	isPopular?: boolean;
	estimatedTime?: string;
	lastGenerated?: string;
	className?: string;
}

const iconMap = {
	progress: BarChart3,
	components: FileText,
	"test-packages": CheckCircle22,
	trends: TrendingUp,
	audit: Shield,
};

const iconColors = {
	progress: "text-blue-600",
	components: "text-green-600",
	"test-packages": "text-purple-600",
	trends: "text-orange-600",
	audit: "text-red-600",
};

const backgroundGradients = {
	progress: "from-blue-50 to-blue-100",
	components: "from-green-50 to-green-100",
	"test-packages": "from-purple-50 to-purple-100",
	trends: "from-orange-50 to-orange-100",
	audit: "from-red-50 to-red-100",
};

/**
 * Report card component for the main reports landing page
 * Shows report type, description, and quick access
 */
export function ReportCard({
	title,
	description,
	href,
	icon,
	badge,
	isNew = false,
	isPopular = false,
	estimatedTime,
	lastGenerated,
	className,
}: ReportCardProps) {
	const IconComponent = iconMap[icon];
	const iconColor = iconColors[icon];
	const gradientBg = backgroundGradients[icon];

	return (
		<Card
			className={cn(
				"group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-md",
				className,
			)}
		>
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<div
						className={cn(
							"p-3 rounded-lg bg-gradient-to-br",
							gradientBg,
						)}
					>
						<IconComponent className={cn("h-6 w-6", iconColor)} />
					</div>
					<div className="flex flex-col gap-1">
						{isNew && (
							<Badge
								status="info"
								className="bg-green-600 hover:bg-green-700 text-xs"
							>
								New
							</Badge>
						)}
						{isPopular && (
							<Badge status="info" className="text-xs">
								<Zap className="h-3 w-3 mr-1" />
								Popular
							</Badge>
						)}
						{badge && (
							<Badge status="info" className="text-xs">
								{badge}
							</Badge>
						)}
					</div>
				</div>

				<CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
					{title}
				</CardTitle>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Report Metadata */}
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					{estimatedTime && (
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							<span>~{estimatedTime}</span>
						</div>
					)}
					{lastGenerated && (
						<div className="flex items-center gap-1">
							<FileText className="h-3 w-3" />
							<span>
								Last:{" "}
								{new Date(lastGenerated).toLocaleDateString()}
							</span>
						</div>
					)}
				</div>

				{/* Action Button */}
				<Link href={href}>
					<Button
						className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
						status="info"
					>
						Generate Report
						<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
