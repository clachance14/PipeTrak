import { getUserSession } from "auth";
import { getTranslator, redirect } from "next-intl/server";
import ChangeNameForm from "./ChangeNameForm";
import ChangePasswordForm from "./ChangePassword";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale, "settings.account");

  return {
    title: t("title"),
  };
}

export default async function AccountSettingsPage() {
  const session = await getUserSession();

  if (!session.user) {
    redirect("/signin");
  }

  return (
    <div className="grid gap-6">
      <ChangeNameForm initialValue={session.user.name} />
      <ChangePasswordForm />
    </div>
  );
}
