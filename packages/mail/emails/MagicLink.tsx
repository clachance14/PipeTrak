import { Link, Text } from "@react-email/components";
import type { BaseMailProps } from "../types";
import PrimaryButton from "./components/PrimaryButton";
import Wrapper from "./components/Wrapper";

export function MagicLink({
	url,
	name,
	otp,
	locale,
	translations,
}: {
	url: string;
	name: string;
	otp: string;
} & BaseMailProps): JSX.Element {
	return (
		<Wrapper>
			<Text>
				Hey {name}, <br /> you requested a login email from supastarter.
				<br />
				<br /> You can either enter the one-time password below manually in the
				application
			</Text>

			<Text>
				One-time password:
				<br />
				<strong className="font-bold text-2xl">{otp}</strong>
			</Text>

			<Text>or use this link:</Text>

			<PrimaryButton href={url}>Continue &rarr;</PrimaryButton>

			<Text className="text-muted-foreground text-sm">
				If you want to open the link in a different browser than your default
				one, copy and paste this link:
				<Link href={url}>{url}</Link>
			</Text>
		</Wrapper>
	);
}

export default MagicLink;
