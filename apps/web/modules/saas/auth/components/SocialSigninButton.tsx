"use client";

import { Button, Icon } from "@ui/components";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function SocialSigninButton({
  provider,
  className,
  ...rest
}: { provider: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const t = useTranslations();
  const providers = useMemo<
    Partial<
      Record<
        string,
        {
          name: string;
          icon: React.ReactElement;
          color: string;
        }
      >
    >
  >(
    () => ({
      google: {
        name: "Google",
        icon: <Icon.google className="h-4 w-4" />,
        color: "#4285F4",
      },
      apple: {
        name: "Apple",
        icon: <Icon.apple className="h-4 w-4" />,
        color: "black",
      },
      github: {
        name: "Github",
        icon: <Icon.github className="h-4 w-4" />,
        color: "black",
      },
      twitter: {
        name: "Twitter",
        icon: <Icon.twitter className="h-4 w-4" />,
        color: "#1DA1F2",
      },
    }),
    [],
  );

  const providerData = useMemo(
    () =>
      provider in providers
        ? providers[provider as keyof typeof providers]
        : null,
    [provider, providers],
  );

  if (!providerData) {
    return null;
  }

  return (
    <Button variant="outline" type="button" {...rest}>
      {providerData.icon && (
        <i className="mr-2 opacity-70">{providerData.icon}</i>
      )}
      {t("auth.continueWithProvider", { provider: providerData.name })}
    </Button>
  );
}
