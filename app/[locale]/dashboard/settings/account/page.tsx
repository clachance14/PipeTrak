import { getUser } from '@auth/server';
import TrpcProvider from '@common/components/TrpcProvider';
import ChangeEmailForm from '@settings/components/ChangeEmail';
import ChangeNameForm from '@settings/components/ChangeNameForm';
import ChangePasswordForm from '@settings/components/ChangePassword';
import { redirect } from 'next-intl/server';

export default async function AccountSettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="grid gap-6">
      <TrpcProvider>
        <ChangeNameForm user={user} />
        <ChangeEmailForm user={user} />
        <ChangePasswordForm />
      </TrpcProvider>
    </div>
  );
}
