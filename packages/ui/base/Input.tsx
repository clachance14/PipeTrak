import React, { forwardRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const input = tv({
  base: [
    "border",
    "border-zinc-300",
    "w-full",
    "bg-transparent",
    // focus
    "focus:ring-1",
  ],
  variants: {
    size: {
      small: ["text-sm", "py-1.5", "px-3", "rounded-md"],
      medium: ["text-base", "py-3", "px-4", "rounded-lg"],
      large: ["text-lg", "py-4", "px-8", "rounded-xl"],
    },
    status: {
      default: [
        "border-zinc-300",
        "focus:ring-zinc-400",
        "focus:border-zinc-400",
        "focus:ring-zinc-400",
        "focus:border-zinc-400",
        "dark:border-zinc-700",
        "dark:focus:ring-zinc-600",
        "dark:focus:border-zinc-600",
      ],
      error: [
        "border-rose-600",
        "focus:ring-rose-600",
        "focus:border-rose-600",
      ],
      success: [
        "border-green-600",
        "focus:ring-green-600",
        "focus:border-green-600",
      ],
    },
  },
  defaultVariants: {
    size: "medium",
    status: "default",
  },
});

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof input> & {
    htmlSize?: number;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, status, htmlSize, type, ...props }, ref) => (
    <input
      type={type ?? "text"}
      className={input({ size, status, className })}
      size={htmlSize}
      ref={ref}
      {...props}
    />
  ),
);

Input.displayName = "Input";
