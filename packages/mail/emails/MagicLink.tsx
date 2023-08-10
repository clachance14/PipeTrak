import { Container, Section } from "@react-email/components";
import PrimaryButton from "./components/PrimaryButton";
import Wrapper from "./components/Wrapper";

export function MagicLink({ url }: { url: string }): JSX.Element {
  return (
    <Wrapper>
      <Section className="bg-white p-8">
        <Container>
          <PrimaryButton href={url}>Sign in</PrimaryButton>
        </Container>
      </Section>
    </Wrapper>
  );
}

MagicLink.subjects = {
  en: "Sign in",
  de: "Anmelden",
};

export default MagicLink;
