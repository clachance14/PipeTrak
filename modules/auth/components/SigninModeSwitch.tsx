'use client';

import { useMemo } from 'react';

export enum SigninMode {
  Password = 'password',
  MagicLink = 'magic-link',
}

export default function SigninModeSwitch({
  activeMode,
  onChange,
  className,
}: {
  activeMode: SigninMode;
  onChange: (mode: SigninMode) => void;
  className?: string;
}) {
  const modes = useMemo<Array<{ key: SigninMode; title: string }>>(
    () => [
      {
        key: SigninMode.MagicLink,
        title: 'Magic Link',
      },
      {
        key: SigninMode.Password,
        title: 'Password',
      },
    ],
    []
  );

  return (
    <div
      className={`${className} flex w-full justify-center rounded-xl bg-zinc-100 p-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          className={`block w-1/2 rounded-lg px-6 py-1.5 text-xs ${
            mode.key === activeMode ? 'bg-white font-bold text-zinc-900 dark:bg-zinc-900 dark:text-white' : ''
          }`}
          onClick={() => onChange(mode.key)}
        >
          {mode.title}
        </button>
      ))}
    </div>
  );
}
