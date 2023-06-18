import { getUser } from '@auth/server';
import ChangeEmailForm from '@settings/components/ChangeEmail';
import ChangeNameForm from '@settings/components/ChangeNameForm';
import ChangePasswordForm from '@settings/components/ChangePassword';
import { getTranslations, redirect } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('settings.account');

  return {
    title: t('title'),
  };
}

export default async function AccountSettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="grid gap-6">
      <ChangeNameForm user={user} />
      <ChangeEmailForm user={user} />
      <ChangePasswordForm />
    </div>
  );
}
