import { AppLayout } from '../../../common/client/components/AppLayout';

export function ClientsPage() {
  return (
    <AppLayout>
      <div className="mb-8 border-b pb-3 dark:border-zinc-800">
        <h2 className="mt-4 text-3xl font-bold">Clients</h2>
        <p className="mt-1 opacity-75">Manage your clients</p>
      </div>
      Manage your clients here
    </AppLayout>
  );
}
