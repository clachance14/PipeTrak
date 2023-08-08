"use client";

import {
  Menu,
  MenuContent,
  MenuOptionItem,
  MenuPositioner,
  MenuTrigger,
} from "@ark-ui/react";
import { Button, Icon } from "@components";
import { usePathname } from "next-intl/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIsClient } from "usehooks-ts";

const localeLabels = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

export function LocaleSwitch({
  locales,
  currentLocale,
}: {
  locales: string[];
  currentLocale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isClientSide = useIsClient();
  const [value, setValue] = useState<{ locale: string }>({
    locale: currentLocale,
  });

  return (
    <Menu
      value={value}
      onValueChange={({ value }) => {
        setValue({ locale: value as string });
        router.replace(`/${value}/${pathname}`);
      }}
      loop
    >
      <MenuTrigger asChild>
        <Button intent="primary-outline" size="medium">
          <Icon.language className="h-4 w-4" />
        </Button>
      </MenuTrigger>

      {isClientSide && (
        <MenuPositioner>
          <MenuContent className="rounded-lg border bg-white p-1 text-zinc-600 shadow-sm focus:outline-none dark:bg-zinc-900">
            {locales.map((locale) => {
              return (
                <MenuOptionItem
                  key={locale}
                  name="locale"
                  type="radio"
                  value={locale}
                  className="flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white"
                >
                  {locale in localeLabels
                    ? localeLabels[locale as keyof typeof localeLabels]
                    : locale}
                </MenuOptionItem>
              );
            })}
          </MenuContent>
        </MenuPositioner>
      )}
    </Menu>
  );
}
