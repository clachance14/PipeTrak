"use client";

import { Button } from "@ui/components";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { cnBase as cn } from "tailwind-variants";

export function ActionBlock({
  children,
  title,
  onSubmit,
  isSubmitting,
  isSubmitDisabled,
  className,
}: PropsWithChildren<{
  onSubmit?: () => void;
  title: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  submitLabel?: string;
  className?: string;
}>) {
  const t = useTranslations();

  return (
    <form
      className={cn(
        "bg-card text-card-foreground border-border overflow-hidden rounded-xl border p-6",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <h2 className="mb-3 text-2xl font-semibold">{title}</h2>
      {children}
      {typeof onSubmit !== "undefined" && (
        <div className="border-border mt-6 flex justify-end border-t pt-3">
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            loading={isSubmitting}
          >
            {t("settings.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
