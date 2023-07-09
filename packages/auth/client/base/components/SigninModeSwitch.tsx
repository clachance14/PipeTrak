"use client";

import { Switch } from "ui";

export enum SigninMode {
  Password = "password",
  MagicLink = "magic-link",
}

export default function SigninModeSwitch({
  activeMode,
  onChange,
  className,
}: {
  activeMode: SigninMode;
  onChange: (mode: string) => void;
  className?: string;
}) {
  const modes = [
    {
      value: SigninMode.MagicLink,
      label: "Magic Link",
    },
    {
      value: SigninMode.Password,
      label: "Password",
    },
  ];

  return (
    <Switch
      options={modes}
      value={activeMode}
      onChange={onChange}
      className={className}
    />
  );
}
