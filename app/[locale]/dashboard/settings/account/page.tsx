import { getUser } from '@auth/server/user';
import { TrpcProvider } from '@common/client/ClientProvider';
import { redirect } from 'next-intl/server';
import ChangeEmailForm from '../../../../../modules/settings/components/ChangeEmail';
import ChangeNameForm from '../../../../../modules/settings/components/ChangeNameForm';
import ChangePasswordForm from '../../../../../modules/settings/components/ChangePassword';

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
