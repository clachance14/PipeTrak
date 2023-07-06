import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import PrimaryButton from "./components/PrimaryButton";

export function ForgotPassword({ url }: { url: string }): JSX.Element {
  return (
    <Html>
      <Heading>Reset your password</Heading>
      <Text>
        It seems like you forgot your password. Click the link below to sign in
        and reset your password.
      </Text>
      <PrimaryButton href={url}>Reset password &rarr;</PrimaryButton>
    </Html>
  );
}

ForgotPassword.subjects = {
  en: "Reset your password",
  de: "Setzen Sie Ihr Passwort zurück",
};
