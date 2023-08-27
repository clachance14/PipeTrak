import { VariantProps, cva } from "class-variance-authority";
import React from "react";
import { Icon } from "./Icon";

export const hint = cva(["px-5", "py-4", "w-full", "rounded-xl"], {
  variants: {
    status: {
      success: ["bg-emerald-500/10", "border-emerald-500"],
      info: ["bg-primary/10", "border-primary"],
      warning: ["bg-amber-500/10", "border-amber-500"],
      error: ["bg-rose-500/10", "border-rose-500"],
    },
  },
  defaultVariants: {
    status: "info",
  },
});

export const hintIcon = cva(
  [
    "flex-shrink-0",
    "flex",
    "items-center",
    "justify-center",
    "text-3xl",
    "leading-tight",
  ],
  {
    variants: {
      status: {
        success: ["text-emerald-600 dark:text-emerald-300"],
        info: ["text-primary-600 dark:text-primary-300"],
        warning: ["text-amber-600 dark:text-amber-300"],
        error: ["text-rose-600 dark:text-rose-300"],
      },
    },
    defaultVariants: {
      status: "info",
    },
  },
);

export const hintTitle = cva(["font-bold", "text-base"], {
  variants: {
    status: {
      success: ["text-emerald-600 dark:text-emerald-300"],
      info: ["text-primary-600 dark:text-primary-300"],
      warning: ["text-amber-600 dark:text-amber-300"],
      error: ["text-rose-600 dark:text-rose-300"],
    },
  },
  defaultVariants: {
    status: "info",
  },
});

export const hintMessage = cva(["text-sm", "leading-tight"], {
  variants: {
    status: {
      success: [
        "text-emerald-900 text-opacity-50 dark:text-emerald-100 dark:text-opacity-50",
      ],
      info: [
        "text-primary-900 text-opacity-50 dark:text-primary-100 dark:text-opacity-50",
      ],
      warning: [
        "text-amber-900 text-opacity-50 dark:text-amber-100 dark:text-opacity-50",
      ],
      error: [
        "text-rose-900 text-opacity-50 dark:text-rose-100 dark:text-opacity-50",
      ],
    },
  },
  defaultVariants: {
    status: "info",
  },
});

export type HintProps = React.HtmlHTMLAttributes<HTMLDivElement> &
  VariantProps<typeof hint> & {
    title?: React.ReactNode;
    message: React.ReactNode;
    icon?: (typeof Icon)[keyof typeof Icon];
  };

export const Hint = ({
  className,
  status,
  title,
  message,
  ...props
}: HintProps) => (
  <div className={hint({ status, className })} {...props}>
    <div className="flex items-center gap-4">
      <div className={hintIcon({ status })}>
        {props.icon !== undefined && <props.icon className="h-6 w-6" />}
      </div>
      <div>
        {title && <strong className={hintTitle({ status })}>{title}</strong>}
        <p className={hintMessage({ status })}>{message}</p>
      </div>
    </div>
  </div>
);

Hint.displayName = "Hint";
