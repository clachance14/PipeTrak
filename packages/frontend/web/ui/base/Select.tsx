"use client";

import {
  Portal,
  SelectContent,
  SelectOption,
  SelectPositioner,
  Select as SelectPrimitive,
  SelectTrigger,
} from "@ark-ui/react";
import { ButtonHTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Icon } from "./Icon";

export const selectClasses = tv({
  base: [
    "border",
    "border-zinc-300",
    "w-full",
    "text-left",
    "bg-transparent",
    "outline-none",
    // focus
    "focus:ring-1",
  ],
  variants: {
    size: {
      small: ["text-sm", "py-1.5", "px-3", "rounded-lg"],
      medium: ["text-base", "py-3", "px-4", "rounded-xl"],
      large: ["text-lg", "py-4", "px-8", "rounded-2xl"],
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

export type SelectProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof selectClasses> & {
    options: { label: string; value: string }[];
    value?: string | string[];
    onChange?: (value?: string | string[] | undefined) => void;
    placeholder?: string;
  };

export function Select({
  size,
  status,
  className,
  value,
  onChange,
  placeholder,
  options,
}: SelectProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <SelectPrimitive
      selectedOption={selectedOption}
      onChange={(option) => onChange?.(option?.value)}
    >
      {({ selectedOption }) => (
        <>
          <SelectTrigger
            className={`${selectClasses({ size, status, className })}`}
          >
            <span className="flex max-w-full items-center justify-between">
              <span className="block flex-1 truncate">
                {selectedOption?.label ?? placeholder ?? "Select option"}
              </span>
              <Icon.chevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
            </span>
          </SelectTrigger>
          <Portal>
            <SelectPositioner className="relative z-50 ">
              <SelectContent
                style={{ width: "var(--reference-width)" }}
                className="rounded-lg border border-zinc-200 bg-white p-1 text-sm text-zinc-600 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {options.map(({ value, label }) => (
                  <SelectOption
                    className="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic text-zinc-700 data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:text-zinc-300 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white"
                    key={value}
                    value={value}
                    label={label}
                  />
                ))}
              </SelectContent>
            </SelectPositioner>
          </Portal>
        </>
      )}
    </SelectPrimitive>
  );
}

Select.displayName = "Select";
