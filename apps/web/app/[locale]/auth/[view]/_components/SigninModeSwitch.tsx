"use client";

import { Switch } from "@components";

export default function SigninModeSwitch({
  activeMode,
  onChange,
  className,
}: {
  activeMode: "password" | "magic-link";
  onChange: (mode: string) => void;
  className?: string;
}) {
  const modes = [
    {
      value: "magic-link",
      label: "Magic Link",
    },
    {
      value: "password",
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
