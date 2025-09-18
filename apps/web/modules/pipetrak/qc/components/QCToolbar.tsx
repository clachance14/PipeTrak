"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { cn } from "@ui/lib";
// TODO: Uncomment these imports when date range functionality is re-enabled
// import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover";
// import { Calendar } from "@ui/components/calendar";
import { Download, RefreshCw, Settings } from "lucide-react";

// TODO: Uncomment these imports when date range functionality is re-enabled
// import { useState } from "react";
// import { format, subDays, startOfDay, endOfDay } from "date-fns";

// TODO: Uncomment when date range functionality is re-enabled
// Custom DateRange type since react-day-picker v9+ doesn't export it
// interface DateRange {
// 	from?: Date;
// 	to?: Date;
// }

interface QCToolbarProps {
	className?: string;
	// TODO: Uncomment when date range functionality is re-enabled
	// onDateRangeChange?: (dateRange: DateRange | undefined) => void;
	onRefresh?: () => void;
	onExport?: () => void;
}

export function QCToolbar({
	className,
	// TODO: Uncomment when date range functionality is re-enabled
	// onDateRangeChange,
	onRefresh,
	onExport,
}: QCToolbarProps) {
	// TODO: Uncomment when date range functionality is re-enabled
	// const [date, setDate] = useState<DateRange | undefined>({
	// 	from: subDays(new Date(), 7), // Default to last 7 days
	// 	to: new Date(),
	// });

	// const handleDateRangeChange = (newDate: DateRange | undefined) => {
	// 	setDate(newDate);
	// 	// Date range change handler disabled for now - will be implemented in future
	// 	// if (onDateRangeChange) {
	// 	// 	// Convert to full day ranges (start of day to end of day)
	// 	// 	const adjustedRange = newDate && newDate.from ? {
	// 	// 		from: startOfDay(newDate.from),
	// 	// 		to: newDate.to ? endOfDay(newDate.to) : endOfDay(newDate.from),
	// 	// 	} : undefined;
	// 	// 	onDateRangeChange(adjustedRange);
	// 	// }
	// };

	// const getDateRangeText = () => {
	// 	if (!date?.from) {
	// 		return "Select date range";
	// 	}
	// 	if (date.to) {
	// 		return `${format(date.from, "MMM d")} - ${format(date.to, "MMM d, yyyy")}`;
	// 	}
	// 	return format(date.from, "MMM d, yyyy");
	// };

	// const applyQuickRange = (days: number) => {
	// 	const newRange = {
	// 		from: subDays(new Date(), days),
	// 		to: new Date(),
	// 	};
	// 	handleDateRangeChange(newRange);
	// };

	return (
		<Card className={cn("p-4", className)}>
			<div className="flex items-center justify-between">
				{/* TODO: Date range selector hidden for now - will be implemented in future */}
				{/* <div className="flex items-center gap-4">
					<span className="text-sm text-muted-foreground font-medium">
						Date Range:
					</span>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"w-60 justify-start text-left font-normal h-8",
									!date && "text-muted-foreground"
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{getDateRangeText()}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="min-w-[18rem] p-0" align="start">
							<div className="p-3 border-b">
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => applyQuickRange(1)}
									>
										Today
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => applyQuickRange(7)}
									>
										7 Days
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => applyQuickRange(30)}
									>
										30 Days
									</Button>
								</div>
							</div>
							<Calendar
								initialFocus
								mode="range"
								defaultMonth={date?.from}
								selected={date}
								onSelect={handleDateRangeChange}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
				</div> */}
				<div />

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0"
						title="Refresh"
						onClick={onRefresh}
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0"
						title="Export"
						onClick={onExport}
					>
						<Download className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0"
						title="Settings"
					>
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}
