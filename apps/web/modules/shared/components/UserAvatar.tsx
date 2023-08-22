import { Avatar, AvatarFallback, AvatarImage } from "@ui/components";
import { useMemo } from "react";

export function UserAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((n) => n[0])
        .join(""),
    [name],
  );

  return (
    <Avatar>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback className="bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
