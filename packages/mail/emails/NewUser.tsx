import { Container } from "@react-email/container";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";
import PrimaryButton from "./components/PrimaryButton";

export function NewUser({ url }: { url: string }): JSX.Element {
  return (
    <Html>
      <Container>
        <Heading as="h1">Welcome to supastarter!</Heading>
        <Text>
          Thank you for signing up to supastarter. Click the link below to
          confirm your email and sign in:
        </Text>
        <PrimaryButton href={url}>Confirm email</PrimaryButton>
      </Container>
    </Html>
  );
}

NewUser.subjects = {
  en: "Welcome to supastarter!",
  de: "Willkommen bei supastarter!",
};
