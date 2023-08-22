"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Icon,
} from "@ui/components";
import { usePathname } from "next-intl/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const localeLabels = {
  en: "English",
  es: "Español",
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
  const [value, setValue] = useState<string>(currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon.language className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            setValue(value);
            router.replace(`/${value}/${pathname}`);
          }}
        >
          {locales.map((locale) => {
            return (
              <DropdownMenuRadioItem key={locale} value={locale}>
                {locale in localeLabels
                  ? localeLabels[locale as keyof typeof localeLabels]
                  : locale}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
