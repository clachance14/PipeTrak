import { config } from "@repo/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { getPurchases } from "@saas/payments/lib/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Layout({ children }) {
    // IMPORTANT: This validates the actual session (not just cookie existence)
    // getSession() checks with the auth backend to ensure the session is valid
    // This is different from middleware which only checks if a cookie exists
    const session = await getSession();
    // If no valid session, redirect to login
    // This works with middleware which allows access to /auth/login
    // preventing redirect loops even with invalid cookies
    if (!session) {
        console.log("[SaaS Layout] No session, redirecting to login");
        redirect("/auth/login");
    }
    if (config.users.enableOnboarding && !session.user.onboardingComplete) {
        redirect("/onboarding");
    }
    const organizations = await getOrganizationList();
    if (config.organizations.enable &&
        config.organizations.requireOrganization) {
        const organization = organizations.find((org) => org.id === session?.session.activeOrganizationId) || organizations[0];
        if (!organization) {
            redirect("/new-organization");
        }
    }
    const hasFreePlan = Object.values(config.payments.plans).some((plan) => "isFree" in plan);
    if (((config.organizations.enable && config.organizations.enableBilling) ||
        config.users.enableBilling) &&
        !hasFreePlan) {
        const organizationId = config.organizations.enable
            ? session?.session.activeOrganizationId || organizations?.at(0)?.id
            : undefined;
        const purchases = await getPurchases(organizationId);
        const { activePlan } = createPurchasesHelper(purchases);
        if (!activePlan) {
            redirect("/choose-plan");
        }
    }
    return children;
}
