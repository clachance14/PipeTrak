import type { ReactNode } from "react";

export function SidebarContentLayout({
	children,
	sidebar,
}: { children: React.ReactNode; sidebar: ReactNode }) {
	return (
		<div className="">
			<div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-8">
				<div className="w-full lg:max-w-[160px]">{sidebar}</div>

				<div className="w-full flex-1">{children}</div>
			</div>
		</div>
	);
}
