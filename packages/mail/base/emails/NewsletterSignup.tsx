import { Container } from "@react-email/container";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Text } from "@react-email/text";

export default function NewsletterSignup(): JSX.Element {
  return (
    <Html>
      <Container>
        <Heading as="h1">Welcome to our newsletter!</Heading>
        <Text>Thank you for signing up for the supastarter newsletter.</Text>
      </Container>
    </Html>
  );
}
