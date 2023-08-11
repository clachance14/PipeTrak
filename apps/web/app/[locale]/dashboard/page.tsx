import { PageHeader, StatsTile } from "@components";
import { createApiCaller } from "api";

export default async function Home() {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.info();
  const user2 = await apiCaller.user.info();

  return (
    <div>
      <PageHeader
        title={`Welcome ${user.name}`}
        subtitle="See the latest stats of your awesome business."
      />

      <div className="container py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <StatsTile
            title="New clients"
            value={344}
            valueFormat="number"
            trend={0.12}
          />
          <StatsTile
            title="Revenue"
            value={5243}
            valueFormat="currency"
            trend={0.6}
          />
          <StatsTile
            title="Churn"
            value={0.03}
            valueFormat="percentage"
            trend={-0.3}
          />
        </div>

        <div className="bg-muted text-muted-foreground mt-8 flex min-h-[40vh] items-center justify-center rounded-xl p-12">
          <div>Here you can add your own content.</div>
        </div>
      </div>
    </div>
  );
}
