"use client";

import { Button } from "@ui/components";
import { useTranslations } from "next-intl";

export function ConfirmationView() {
  const t = useTranslations();

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("auth.confirmation.title")}</h1>
      <p className="text-muted-foreground mb-4 mt-2">
        {t("auth.confirmation.message")}
      </p>
      <Button className="w-full" onClick={() => window.close()}>
        {t("auth.confirmation.close")}
      </Button>
    </div>
  );
}
