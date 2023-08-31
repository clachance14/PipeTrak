import { PageHeader, TabGroup } from "@saas/shared/components";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

export default function SettingsLayout({
  children,
  params: { teamSlug },
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const t = useTranslations();

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <div className="mt-6">
        <TabGroup
          items={["account", "team", "billing"].map((segment) => ({
            label: t(`settings.${segment}.title` as any),
            href: `/${teamSlug}/settings/${segment}`,
            segment,
          }))}
          className="mb-6"
        />

        {children}
      </div>
    </div>
  );
}
