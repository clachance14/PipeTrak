import { Button } from "@react-email/button";
import { Html } from "@react-email/html";

export default function MagicLink({ url }: { url: string }): JSX.Element {
  return (
    <Html>
      <Button
        pX={20}
        pY={12}
        href={url}
        style={{ background: "#000", color: "#fff" }}
      >
        Sign in
      </Button>
    </Html>
  );
}
