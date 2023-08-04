"use client";

import {
  ToastCloseTrigger,
  ToastDescription,
  ToastGroup,
  ToastPlacements,
  Toast as ToastPrimitive,
  ToastProvider as ToastProviderPrimitive,
  ToastTitle,
  useToast,
} from "@ark-ui/react";
import { PropsWithChildren } from "react";
import { tv } from "tailwind-variants";
import { Icon } from "./Icon";

const toastTypeClasses = tv({
  variants: {
    type: {
      success: ["text-emerald-500"],
      info: ["text-primary-500"],
      warning: ["text-amber-500"],
      error: ["text-rose-500"],
      loading: ["text-primary-500"],
      custom: ["bg-zinc-700"],
    },
  },
});

const toastTypeIcon = {
  success: Icon.success,
  info: Icon.info,
  warning: Icon.warning,
  error: Icon.error,
  loading: Icon.spinner,
};

export function ToastProvider({ children }: PropsWithChildren<{}>) {
  return (
    <ToastProviderPrimitive>
      <ToastPlacements>
        {(placements) =>
          placements.map((placement) => (
            <ToastGroup key={placement} placement={placement}>
              {(toasts) =>
                toasts.map((toast) => {
                  const { type } = toast.initialContext;
                  const ToastIcon =
                    toastTypeIcon[type as keyof typeof toastTypeIcon];

                  return (
                    <ToastPrimitive
                      key={toast.id}
                      toast={toast}
                      className={`relative w-full max-w-sm rounded-xl border bg-white p-4 py-4 pr-10 shadow-xl dark:border-zinc-700 dark:bg-zinc-900`}
                    >
                      <div className="flex items-center gap-3">
                        {ToastIcon ? (
                          <ToastIcon
                            className={`${toastTypeClasses({
                              type,
                              className: `text-2xl ${
                                type === "loading" ? "animate-spin" : ""
                              }`,
                            })}`}
                          />
                        ) : null}

                        <div>
                          <ToastTitle
                            className={`${toastTypeClasses({
                              className: "text-base font-bold",
                            })}`}
                          />
                          <ToastDescription />
                          <ToastCloseTrigger className="absolute right-3 top-3 p-1 hover:opacity-70">
                            <Icon.close className="h-4 w-4" />
                            <span className="sr-only">Cancel</span>
                          </ToastCloseTrigger>
                        </div>
                      </div>
                    </ToastPrimitive>
                  );
                })
              }
            </ToastGroup>
          ))
        }
      </ToastPlacements>

      {children}
    </ToastProviderPrimitive>
  );
}

export { useToast };
