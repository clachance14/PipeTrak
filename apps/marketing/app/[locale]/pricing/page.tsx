import { getAllPlans } from "billing/subscriptions";
import { getTranslator } from "next-intl/server";
import { PricingTable } from "./PricingTable";

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const plans = await getAllPlans();
  const t = await getTranslator(locale, "pricing");

  return (
    <main>
      <div className="px-8 pb-24 pt-48">
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold lg:text-5xl">{t("title")}</h1>
            <p className="mt-3 text-lg opacity-50">{t("description")}</p>
          </div>

          <PricingTable plans={plans} />
        </div>
      </div>
    </main>
  );
}
