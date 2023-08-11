import { Container, Heading, Section, Text } from "@react-email/components";
import PrimaryButton from "./components/PrimaryButton";
import Wrapper from "./components/Wrapper";

export function ForgotPassword({ url }: { url: string }): JSX.Element {
  return (
    <Wrapper>
      <Section className="bg-card p-8">
        <Container>
          <Heading>Reset your password</Heading>
          <Text>
            It seems like you forgot your password. Click the link below to sign
            in and reset your password.
          </Text>
          <PrimaryButton href={url}>Reset password &rarr;</PrimaryButton>
        </Container>
      </Section>
    </Wrapper>
  );
}

ForgotPassword.subjects = {
  en: "Reset your password",
  de: "Setzen Sie Ihr Passwort zurück",
};

export default ForgotPassword;
