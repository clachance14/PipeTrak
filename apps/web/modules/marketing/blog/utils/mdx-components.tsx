import { Link } from "@i18n";
import { slugifyHeadline } from "@shared/lib/content";
import Image from "next/image";
import type { PropsWithChildren } from "react";

const CustomImage = (props: { alt?: string; src: string }) => (
  <Image
    {...props}
    alt={props.alt ?? ""}
    className="rounded-lg shadow"
    loading="lazy"
  />
);

const CustomLink = (props: PropsWithChildren<{ href: string }>) => {
  const { href, children, ...rest } = props;
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));

  return isInternalLink ? (
    <Link href={href} {...rest}>
      {children}
    </Link>
  ) : (
    <a target="_blank" rel="noopener noreferrer" href={href} {...rest}>
      {children}
    </a>
  );
};

const CustomH1 = ({ children, ...rest }: PropsWithChildren) => (
  <h1
    id={slugifyHeadline(children as string)}
    className="mb-6 text-4xl font-bold"
    {...rest}
  >
    {children}
  </h1>
);

const CustomH2 = ({ children, ...rest }: PropsWithChildren) => (
  <h2
    id={slugifyHeadline(children as string)}
    className="mb-4 text-2xl font-bold"
    {...rest}
  >
    {children}
  </h2>
);

const CustomH3 = ({ children, ...rest }: PropsWithChildren) => (
  <h3
    id={slugifyHeadline(children as string)}
    className="mb-4 text-xl font-bold"
    {...rest}
  >
    {children}
  </h3>
);

const CustomH4 = ({ children, ...rest }: PropsWithChildren) => (
  <h4
    id={slugifyHeadline(children as string)}
    className="mb-4 text-lg font-bold"
    {...rest}
  >
    {children}
  </h4>
);

const CustomH5 = ({ children, ...rest }: PropsWithChildren) => (
  <h5
    id={slugifyHeadline(children as string)}
    className="mb-4 text-base font-bold"
    {...rest}
  >
    {children}
  </h5>
);

const CustomH6 = ({ children, ...rest }: PropsWithChildren) => (
  <h6
    id={slugifyHeadline(children as string)}
    className="mb-4 text-sm font-bold"
    {...rest}
  >
    {children}
  </h6>
);

const CustomParagraph = ({ children, ...rest }: PropsWithChildren) => (
  <p className="text-foreground/60 mb-6 leading-relaxed" {...rest}>
    {children}
  </p>
);

const CustomUnorderedList = ({ children, ...rest }: PropsWithChildren) => (
  <ul className="mb-6 list-inside list-disc space-y-2 pl-4" {...rest}>
    {children}
  </ul>
);

const CustomOrderedList = ({ children, ...rest }: PropsWithChildren) => (
  <ol className="mb-6 list-inside list-decimal space-y-2 pl-4" {...rest}>
    {children}
  </ol>
);

const CustomListItem = ({ children, ...rest }: PropsWithChildren) => (
  <li {...rest}>{children}</li>
);

export const mdxComponents = {
  a: CustomLink,
  img: CustomImage,
  h1: CustomH1,
  h2: CustomH2,
  h3: CustomH3,
  h4: CustomH4,
  h5: CustomH5,
  h6: CustomH6,
  p: CustomParagraph,
  ul: CustomUnorderedList,
  ol: CustomOrderedList,
  li: CustomListItem,
};
