'use client';

import Button from '@common/components/primitives/Button';
import * as menu from '@zag-js/menu';
import { normalizeProps, useMachine } from '@zag-js/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useId } from 'react';
import { FiHardDrive, FiMoon, FiSun } from 'react-icons/fi';
import { useIsClient } from 'usehooks-ts';

export default function ColorModeToggle() {
  const t = useTranslations('common.colorMode');
  const { resolvedTheme, setTheme, theme } = useTheme();
  const isClientSide = useIsClient();

  const [state, send] = useMachine(
    menu.machine({
      id: useId(),
      'aria-label': 'Color mode',
      value: { colorScheme: theme as string },
      onValueChange: ({ value }) => setTheme(value as string),
      loop: true,
    })
  );
  const api = menu.connect(state, send, normalizeProps);

  const colorModeOptions = [
    {
      value: 'system',
      label: t('system'),
      icon: <FiHardDrive />,
    },
    {
      value: 'light',
      label: t('light'),
      icon: <FiSun />,
    },
    {
      value: 'dark',
      label: t('dark'),
      icon: <FiMoon />,
    },
  ];

  return (
    <div>
      <Button intent="primary-outline" size="small" {...api.triggerProps}>
        {isClientSide && resolvedTheme === 'light' ? <FiSun /> : <FiMoon />}
      </Button>

      {isClientSide && (
        <div className="" {...api.positionerProps}>
          <ul
            className="rounded-lg border border-zinc-200 bg-white p-1 text-zinc-600 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            {...api.contentProps}
          >
            {colorModeOptions.map((option) => (
              <li
                key={option.value}
                className="flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white"
                {...api.getOptionItemProps({ name: 'colorScheme', type: 'radio', value: option.value })}
              >
                {option.icon} {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
