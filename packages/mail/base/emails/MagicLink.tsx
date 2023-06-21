import { Html } from "@react-email/html";
import PrimaryButton from "./components/PrimaryButton";

export default function MagicLink({ url }: { url: string }): JSX.Element {
  return (
    <Html>
      <PrimaryButton href={url}>Sign in</PrimaryButton>
    </Html>
  );
}
