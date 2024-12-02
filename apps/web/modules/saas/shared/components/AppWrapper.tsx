import { config } from "@repo/config";
import { Footer } from "@saas/shared/components/Footer";
import { NavBar } from "@saas/shared/components/NavBar";
import { cn } from "@ui/lib";
import type { PropsWithChildren } from "react";

export function AppWrapper({ children }: PropsWithChildren) {
	return (
		<div
			className={cn("px-0", [
				config.ui.saas.useSidebarLayout ? "md:ml-[280px] md:pr-4" : "",
			])}
		>
			<NavBar />
			<main
				className={cn(
					"container mt-4 max-w-6xl rounded-xl bg-card shadow-sm md:rounded-3xl",
					[
						config.ui.saas.useSidebarLayout
							? "ml-0 min-h-[calc(100vh-6rem)] py-6 md:min-h-[calc(100vh-5.5rem)]"
							: "py-6",
					],
				)}
			>
				{children}
			</main>
			<Footer />
		</div>
	);
}
