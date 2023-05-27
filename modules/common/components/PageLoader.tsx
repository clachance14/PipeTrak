import { Icon } from '@ui/components';

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Icon.spinner className="h-4 w-4 animate-spin text-3xl text-blue-400" />
    </div>
  );
}
