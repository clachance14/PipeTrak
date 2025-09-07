"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { HardDrive, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ColorModeToggle() {
	const { setTheme, theme } = useTheme();
	const [value, setValue] = useState<string>(theme ?? "system");
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const colorModeOptions = [
		{
			value: "system",
			label: "System",
			icon: HardDrive,
		},
		{
			value: "light",
			label: "Light",
			icon: Sun,
		},
		{
			value: "dark",
			label: "Dark",
			icon: Moon,
		},
	];

	if (!isClient) {
		return null;
	}

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					data-test="color-mode-toggle"
					aria-label="Color mode"
				>
					{theme === "light" ? (
						<Sun className="size-4" />
					) : (
						<Moon className="size-4" />
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(value) => {
						setTheme(value);
						setValue(value);
					}}
				>
					{colorModeOptions.map((option) => (
						<DropdownMenuRadioItem
							key={option.value}
							value={option.value}
							data-test={`color-mode-toggle-item-${option.value}`}
						>
							<option.icon className="mr-2 size-4 opacity-50" />{" "}
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
