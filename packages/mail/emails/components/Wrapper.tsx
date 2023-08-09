import { Font, Head, Html, Tailwind } from "@react-email/components";
import { PropsWithChildren } from "react";

const { theme } = require("tailwind-config");

export default function Wrapper({ children }: PropsWithChildren) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind config={{ theme }}>{children}</Tailwind>
    </Html>
  );
}
