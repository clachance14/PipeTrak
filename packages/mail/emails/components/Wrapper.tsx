import { Font, Head, Html, Tailwind } from "@react-email/components";
import { PropsWithChildren } from "react";

const { theme } = require("tailwind-config");

export default function Wrapper({ children }: PropsWithChildren) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind config={{ theme }}>{children}</Tailwind>
    </Html>
  );
}
