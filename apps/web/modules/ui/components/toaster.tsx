"use client";

import { AlertCircleIcon, BellIcon, CheckIcon, LoaderIcon } from "lucide-react";
import type { JSXElementConstructor } from "react";
import { useToast } from "../hooks/use-toast";
import type { ToastProps } from "./toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

const variantIcons: Record<
  NonNullable<ToastProps["variant"]>,
  JSXElementConstructor<{ className?: string }>
> = {
  default: BellIcon,
  loading: LoaderIcon,
  success: CheckIcon,
  error: AlertCircleIcon,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const ToastIcon =
          props.icon ?? props.variant != null
            ? variantIcons[props.variant!]
            : undefined;
        return (
          <Toast key={id} {...props}>
            <div className="flex items-center gap-3">
              {ToastIcon !== undefined && (
                <ToastIcon
                  className={`size-6 shrink-0 opacity-50 ${
                    props.variant === "loading" ? "animate-spin" : ""
                  }`}
                />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>

            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
