import { config } from "@repo/config";
import { NavBar } from "@saas/shared/components/NavBar";
import { MobileNavBar } from "@saas/shared/components/MobileNavBar";
import { cn } from "@ui/lib";
import type { PropsWithChildren } from "react";

export function AppWrapper({ children }: PropsWithChildren) {
	return (
		<div
			className={cn("bg-transparent", [
				config.ui.saas.useSidebarLayout ? "" : "",
			])}
		>
			{/* Mobile navigation (hidden on lg and up) */}
			<MobileNavBar />

			{/* Desktop navigation (hidden on mobile) */}
			<div className="hidden lg:block">
				<NavBar />
			</div>

			<div
				className={cn("flex", [
					config.ui.saas.useSidebarLayout
						? "min-h-screen md:ml-[280px]" // Match sidebar breakpoint
						: "",
				])}
			>
				<main
					className={cn("min-h-full w-full bg-white", [
						config.ui.saas.useSidebarLayout ? "" : "",
					])}
				>
					{children}
				</main>
			</div>
		</div>
	);
}
