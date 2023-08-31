"use client";

import { useUser } from "@saas/auth";
import { Button, Icon } from "@ui/components";
import { useTranslations } from "next-intl";

export function ConfirmationView() {
  const t = useTranslations();
  const { user, loaded } = useUser();

  if (!loaded)
    return (
      <div className="flex items-center justify-center py-8">
        <Icon.spinner className="text-primary h-6 w-6 animate-spin" />
      </div>
    );

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
