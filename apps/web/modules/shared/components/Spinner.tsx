import { cn } from "@ui/lib";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
	return (
		<Loader2
			className={cn("size-4 animate-spin text-primary", className)}
		/>
	);
}
