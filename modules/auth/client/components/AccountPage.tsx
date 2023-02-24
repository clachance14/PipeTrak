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

  return (
    <AppLayout>
      <div className="mb-8 border-b pb-3 dark:border-zinc-800">
        <h2 className="mt-4 text-3xl font-bold">{t('accountPage.title')}</h2>
        <p className="mt-1 opacity-75">{t('accountPage.subtitle')}</p>
      </div>
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-xl border-2 p-6 dark:border-zinc-800">
          <h2 className="mb-3 text-2xl font-semibold">{t('accountPage.name')}</h2>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t  px-6 py-3 dark:border-zinc-800 ">
            <Button
              size="small"
              isLoading={changeNameMutation.isLoading}
              onClick={() => changeNameMutation.mutate({ name })}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border-2 p-6 dark:border-zinc-800">
          <h2 className="mb-2 text-2xl font-semibold">{t('accountPage.email.title')}</h2>
          <p className="mb-3 opacity-75">{t('accountPage.email.description')}</p>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t  px-6 py-3 dark:border-zinc-800 ">
            <Button
              size="small"
              isLoading={changeEmailMutation.isLoading}
              onClick={() => changeEmailMutation.mutate({ email })}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
