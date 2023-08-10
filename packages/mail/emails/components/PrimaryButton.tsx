import { Button } from "@react-email/components";
import { PropsWithChildren } from "react";

export default function PrimaryButton({
  href,
  children,
}: PropsWithChildren<{
  href: string;
}>) {
  return (
    <Button
      pX={20}
      pY={12}
      href={href}
      style={{ background: "#000", color: "#fff", borderRadius: "8px" }}
    >
      {children}
    </Button>
  );
}
