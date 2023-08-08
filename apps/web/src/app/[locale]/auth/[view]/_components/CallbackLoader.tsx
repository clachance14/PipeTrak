"use client";

import { Icon } from "@/components";
import { useTranslations } from "next-intl";

export default function CallbackLoader() {
  const t = useTranslations("auth.callback");

  return (
    <div className="text-center">
      <Icon.spinner className="text-primary-500 mx-auto h-8 w-8 animate-spin" />
      <h1 className="mt-4 text-lg font-bold">{t("title")}</h1>
      <p>{t("message")}</p>
    </div>
  );
}
