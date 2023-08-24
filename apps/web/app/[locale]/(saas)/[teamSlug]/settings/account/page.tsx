import { ChangeNameForm, ChangePasswordForm } from "@saas/settings/components";
import { createApiCaller } from "api";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("settings.account.title"),
  };
}

export default async function AccountSettingsPage() {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.me();

  return (
    <div className="grid gap-6">
      <ChangeNameForm initialValue={user.name} />
      <ChangePasswordForm />
    </div>
  );
}
