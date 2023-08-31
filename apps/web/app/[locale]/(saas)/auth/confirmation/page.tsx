import { ConfirmationView } from "@saas/auth/components";
import { createApiCaller } from "api";
import { redirect } from "next-intl/server";

export default async function VerifyOtpPage() {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.me();

  if (!user) return redirect("/auth/login");

  return <ConfirmationView />;
}
