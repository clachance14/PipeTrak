import { getAllPlans } from "billing/subscriptions";
import PricingTable from "./PricingTable";

export default async function PricingPage() {
  const plans = await getAllPlans();

  return (
    <main>
      <div className="px-8 pt-36 pb-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold lg:text-5xl">Pricing</h1>
            <p className="mt-3 text-lg opacity-50">
              We have the right plan for every need.
            </p>
          </div>

          <PricingTable plans={plans} />
        </div>
      </div>
    </main>
  );
}
