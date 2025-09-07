import * as React from "react";
import { cn } from "../lib";

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	type?: "single" | "multiple";
	value?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	size?: "default" | "sm" | "lg";
	children?: React.ReactNode;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
	(
		{
			className,
			type = "single",
			value,
			onValueChange,
			size = "default",
			children,
			...props
		},
		ref,
	) => {
		const sizeClasses = {
			sm: "h-8 p-0.5",
			default: "h-10 p-1",
			lg: "h-12 p-1",
		};

		return (
			// biome-ignore lint/a11y/useSemanticElements: Custom toggle group implementation
			<div
				ref={ref}
				role="group"
				className={cn(
					"inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground",
					sizeClasses[size],
					className,
				)}
				{...props}
			>
				{React.Children.map(children, (child) => {
					if (React.isValidElement(child)) {
						const childProps = child.props as { value: string };
						return React.cloneElement(
							child as React.ReactElement<any>,
							{
								isActive:
									type === "single"
										? childProps.value === value
										: value?.includes(childProps.value),
								onClick: () => {
									if (type === "single") {
										onValueChange?.(childProps.value);
									} else {
										// Multiple selection logic (not used in our case)
										const currentValue =
											(value as string[]) || [];
										const newValue = currentValue.includes(
											childProps.value,
										)
											? currentValue.filter(
													(v) =>
														v !== childProps.value,
												)
											: [
													...currentValue,
													childProps.value,
												];
										onValueChange?.(newValue);
									}
								},
								size,
							},
						);
					}
					return child;
				})}
			</div>
		);
	},
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	value: string;
	isActive?: boolean;
	size?: "default" | "sm" | "lg";
	children?: React.ReactNode;
}

const ToggleGroupItem = React.forwardRef<
	HTMLButtonElement,
	ToggleGroupItemProps
>(
	(
		{
			className,
			value,
			isActive,
			size = "default",
			children,
			onClick,
			...props
		},
		ref,
	) => {
		const sizeClasses = {
			sm: "px-2.5 py-1 text-xs",
			default: "px-3 py-1.5 text-sm",
			lg: "px-4 py-2 text-base",
		};

		return (
			// biome-ignore lint/a11y/useSemanticElements: Custom toggle button with radio semantics
			<button
				ref={ref}
				type="button"
				role="radio"
				aria-checked={isActive}
				aria-label={props["aria-label"]}
				className={cn(
					"inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					sizeClasses[size],
					isActive
						? "bg-background text-foreground shadow-sm"
						: "hover:bg-background/50 hover:text-foreground",
					className,
				)}
				onClick={onClick}
				{...props}
			>
				{children}
			</button>
		);
	},
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
