import { config } from "@repo/config";
import { cn } from "@ui/lib";
import Image from "next/image";

export function Logo({
	withLabel = false,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<Image
				src="/images/pipetrak-logo.png"
				alt={config.appName}
				width={160}
				height={40}
				className="h-10 w-auto"
				priority
			/>
			{withLabel && (
				<span className="ml-3 hidden text-lg md:block">
					{config.appName}
				</span>
			)}
		</span>
	);
}
