import React from "react";
import { config } from "@repo/config";

export function Logo({ withLabel = false }: { withLabel?: boolean }) {
	return (
		<span className="flex items-center font-semibold text-primary leading-none">
			<img
				src="https://pipetrak.com/images/pipetrak-logo.png"
				alt={config.appName}
				width="160"
				height="40"
				style={{ height: "48px", width: "auto" }}
			/>
			{withLabel && (
				<span className="ml-3 text-xl">{config.appName}</span>
			)}
		</span>
	);
}
