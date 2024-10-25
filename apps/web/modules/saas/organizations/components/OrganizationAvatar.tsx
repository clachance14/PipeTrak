import { config } from "@repo/config";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/avatar";
import BoringAvatar from "boring-avatars";
import { forwardRef, useMemo } from "react";

export const OrganizationAvatar = forwardRef<
	HTMLSpanElement,
	{
		name: string;
		avatarUrl?: string | null;
		className?: string;
	}
>(({ name, avatarUrl, className }, ref) => {
	const avatarSrc = useMemo(
		() =>
			avatarUrl
				? avatarUrl.startsWith("http")
					? avatarUrl
					: `/image-proxy/${config.storage.bucketNames.avatars}/${avatarUrl}`
				: undefined,
		[avatarUrl],
	);

	return (
		<Avatar ref={ref} className={className}>
			<AvatarImage src={avatarSrc} />
			<AvatarFallback>
				<BoringAvatar
					size={96}
					name={name}
					variant="marble"
					colors={config.organizations.avatarColors}
				/>
			</AvatarFallback>
		</Avatar>
	);
});

OrganizationAvatar.displayName = "OrganizationAvatar";
