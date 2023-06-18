import type MagicLink from "./MagicLink";

export const emails = {
  magicLink: (props: Parameters<typeof MagicLink>[0]) =>
    import("./MagicLink").then((m) => m.default(props)),
};
