import { redirect } from "next/navigation";

export default async function SettingsPage({
  params: { teamSlug },
}: {
  params: { teamSlug: string };
}) {
  redirect(`/${teamSlug}/settings/team/general`);
}
