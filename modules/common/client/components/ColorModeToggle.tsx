import * as menu from '@zag-js/menu';
import { normalizeProps, useMachine } from '@zag-js/react';
import { useTranslation } from 'next-i18next';
import { useTheme } from 'next-themes';
import { FiHardDrive, FiMoon, FiSun } from 'react-icons/fi';
import { useIsClient } from 'usehooks-ts';
import { Button } from './Button';

export function ColorModeToggle() {
  const { t } = useTranslation('common');
  const { resolvedTheme, setTheme, theme } = useTheme();
  const isClientSide = useIsClient();

  const [state, send] = useMachine(
    menu.machine({
      id: '1',
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
      label: t('colorMode.system'),
      icon: <FiHardDrive />,
    },
    {
      value: 'light',
      label: t('colorMode.light'),
      icon: <FiSun />,
    },
    {
      value: 'dark',
      label: t('colorMode.dark'),
      icon: <FiMoon />,
    },
  ];

  return (
    <div>
      <Button
        intent="primary-outline"
        size="small"
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        {...api.triggerProps}
      >
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
