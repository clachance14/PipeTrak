import { Icon } from 'ui';

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Icon.spinner className="h-4 w-4 animate-spin text-3xl text-primary-400" />
    </div>
  );
}
