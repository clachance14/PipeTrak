import { button } from '@common/components/primitives/Button';
import { BuiltInProviderType } from 'next-auth/providers';
import { useMemo } from 'react';
import { FaApple, FaDiscord, FaGithub, FaGoogle, FaTwitter } from 'react-icons/fa';

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
        icon: <FaGoogle />,
      },
      apple: {
        name: 'Apple',
        icon: <FaApple />,
      },
      github: {
        name: 'Github',
        icon: <FaGithub />,
      },
      twitter: {
        name: 'Twitter',
        icon: <FaTwitter />,
      },
      discord: {
        name: 'Discord',
        icon: <FaDiscord />,
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
