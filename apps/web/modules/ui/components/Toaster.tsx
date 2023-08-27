"use client";

import { JSXElementConstructor } from "react";
import { useToast } from "../hooks/use-toast";
import { Icon } from "./Icon";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast";

const variantIcons: Record<
  NonNullable<ToastProps["variant"]>,
  JSXElementConstructor<{ className?: string }>
> = {
  default: Icon.notification,
  success: Icon.check,
  error: Icon.error,
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
                <ToastIcon className="h-4 w-4 opacity-50" />
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
