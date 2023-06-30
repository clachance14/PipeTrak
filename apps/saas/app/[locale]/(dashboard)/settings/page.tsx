import { redirect } from "next-intl/server";

export default async function SettingsPage() {
  redirect("/settings/account");
}
