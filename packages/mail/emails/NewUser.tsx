import { Container, Heading, Section, Text } from "@react-email/components";
import PrimaryButton from "./components/PrimaryButton";
import Wrapper from "./components/Wrapper";

export function NewUser({ url }: { url: string }): JSX.Element {
  return (
    <Wrapper>
      <Section className="bg-white p-8">
        <Container>
          <Heading as="h1">Welcome to supastarter!</Heading>
          <Text>
            Thank you for signing up to supastarter. Click the link below to
            confirm your email and sign in:
          </Text>
          <PrimaryButton href={url}>Confirm email</PrimaryButton>
        </Container>
      </Section>
    </Wrapper>
  );
}

NewUser.subjects = {
  en: "Welcome to supastarter!",
  de: "Willkommen bei supastarter!",
};

export default NewUser;
