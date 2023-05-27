import { Icon, button } from '@ui/components';
import { BuiltInProviderType } from 'next-auth/providers';
import { useMemo } from 'react';

export function SocialSigninButton({
  provider,
  className,
  ...rest
}: { provider: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const providers = useMemo<
    Partial<
      Record<
        BuiltInProviderType,
        {
          name: string;
          icon?: React.ReactElement;
        }
      >
    >
  >(
    () => ({
      google: {
        name: 'Google',
        icon: <Icon.google className="h-4 w-4" />,
      },
      apple: {
        name: 'Apple',
        icon: <Icon.apple className="h-4 w-4" />,
      },
      github: {
        name: 'Github',
        icon: <Icon.github className="h-4 w-4" />,
      },
      twitter: {
        name: 'Twitter',
        icon: <Icon.twitter className="h-4 w-4" />,
      },
    }),
    []
  );

  const providerData = useMemo(
    () => (provider in providers ? providers[provider as keyof typeof providers] : null),
    [provider, providers]
  );

  if (!providerData) {
    return null;
  }

  return (
    <button type="button" className={button({ intent: provider as any, size: 'small', className: 'w-full' })} {...rest}>
      {providerData.icon && <i className="mr-2 text-lg">{providerData.icon}</i>}
      Continue with {providerData.name}
    </button>
  );
}
