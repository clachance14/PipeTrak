import { redirect } from "next/navigation";

export default async function SettingsPage() {
  redirect(`/app/settings/team/general`);
}
