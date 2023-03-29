import { getUser } from '@auth/server';
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
      <ChangeNameForm user={user} />
      <ChangeEmailForm user={user} />
      <ChangePasswordForm />
    </div>
  );
}
