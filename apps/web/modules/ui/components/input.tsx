import { cn } from "@ui/lib";
import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors disabled:cursor-not-allowed file:border-0 focus-visible:border-primary file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
