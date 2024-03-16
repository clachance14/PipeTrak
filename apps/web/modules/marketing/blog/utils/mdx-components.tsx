import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";

const CustomImage = (props: { alt?: string; src: string }) => (
  <Image {...props} alt={props.alt ?? ""} loading="lazy" />
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

export const mdxComponents = {
  a: CustomLink,
  img: CustomImage,
};
