import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@ui/lib";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        error:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent text-primary hover:bg-primary/10",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 rounded-lg px-4 py-2",
        sm: "h-8 rounded-md px-3 text-sm",
        lg: "h-10 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = {
  asChild?: boolean;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant,
      size,
      asChild = false,
      loading,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? <LoaderIcon className="size-4 animate-spin" /> : children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
