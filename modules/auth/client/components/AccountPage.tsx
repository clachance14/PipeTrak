import PasswordInput from '@auth/client/components/PasswordInput';
import { Button, Input } from '@common/client';
import { trpc } from '@common/server';
import { Session } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { AppLayout } from '../../../common/client/components/AppLayout';

interface Props {
  user: Session['user'];
}

export function AccountPage({ user }: Props) {
  const { t } = useTranslation('auth');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');

  const changeNameMutation = trpc.changeName.useMutation({
    onSuccess: async () => {
      // first update the session
      await fetch('/api/auth/session?update');
      // then reload the page to make sure the session is updated everywhere
      window.location.reload();
    },
  });

  const changeEmailMutation = trpc.changeEmail.useMutation({
    onSuccess: async () => {
      // send verification email
      await signIn('change-email', { email, redirect: false, callbackUrl: window.location.href });

      // sign the user out to force them to verify their email
      await signOut();
    },
  });

  const changePasswordMutation = trpc.changePassword.useMutation({
    onSuccess: async () => {
      // reset the form
      setPassword('');
    },
  });

  return (
    <AppLayout>
      <div className="mb-8 border-b pb-3 dark:border-zinc-800">
        <h2 className="mt-4 text-3xl font-bold">{t('accountPage.title')}</h2>
        <p className="mt-1 opacity-75">{t('accountPage.subtitle')}</p>
      </div>
      <div className="grid gap-6">
        {/* Change user name */}
        <form
          className="overflow-hidden rounded-xl border-2 p-6 dark:border-zinc-800"
          onSubmit={(e) => {
            e.preventDefault();
            changeNameMutation.mutate({ name });
          }}
        >
          <h2 className="mb-3 text-2xl font-semibold">{t('accountPage.name')}</h2>
          <Input type="text" className="max-w-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t  px-6 py-3 dark:border-zinc-800 ">
            <Button
              type="submit"
              size="small"
              isLoading={changeNameMutation.isLoading}
              disabled={!name || name.length < 3 || name === user.name}
            >
              {t('accountPage.save')}
            </Button>
          </div>
        </form>

        {/* Change user email */}
        <form
          className="overflow-hidden rounded-xl border-2 p-6 dark:border-zinc-800"
          onSubmit={(e) => {
            e.preventDefault();
            changeEmailMutation.mutate({ email });
          }}
        >
          <h2 className="mb-2 text-2xl font-semibold">{t('accountPage.email.title')}</h2>
          <p className="mb-3 opacity-75">{t('accountPage.email.description')}</p>
          <Input type="email" className="max-w-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="-mx-6 -mb-6 mt-6 flex items-center justify-between gap-4 border-t  px-6 py-3 dark:border-zinc-800 ">
            <p className="text-sm opacity-50">{t('accountPage.email.note')}</p>
            <Button
              size="small"
              type="submit"
              isLoading={changeEmailMutation.isLoading}
              disabled={email === user.email || !email}
            >
              {t('accountPage.save')}
            </Button>
          </div>
        </form>

        {/* Change user password */}
        <form
          className="overflow-hidden rounded-xl border-2 p-6 dark:border-zinc-800"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <h2 className="mb-2 text-2xl font-semibold">{t('accountPage.password.title')}</h2>
          <p className="mb-3 opacity-75">{t('accountPage.password.description')}</p>
          <PasswordInput className="max-w-sm" value={password} onChange={(value) => setPassword(value)} />
          <div className="-mx-6 -mb-6 mt-6 flex items-center justify-between gap-4 border-t px-6 py-3 dark:border-zinc-800">
            <p className="text-sm opacity-50">{t('accountPage.password.note')}</p>
            <Button
              type="submit"
              size="small"
              isLoading={changePasswordMutation.isLoading}
              disabled={!password || password.length < 8}
            >
              {t('accountPage.save')}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
