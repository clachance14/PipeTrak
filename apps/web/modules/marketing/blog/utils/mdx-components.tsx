import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import slugify from "slugify";

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

const CustomH1 = ({ children, ...rest }: PropsWithChildren) => (
  <h1
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-6 text-4xl font-bold"
    {...rest}
  >
    {children}
  </h1>
);

const CustomH2 = ({ children, ...rest }: PropsWithChildren) => (
  <h2
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-4 text-2xl font-bold"
    {...rest}
  >
    {children}
  </h2>
);

const CustomH3 = ({ children, ...rest }: PropsWithChildren) => (
  <h3
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-4 text-xl font-bold"
    {...rest}
  >
    {children}
  </h3>
);

const CustomH4 = ({ children, ...rest }: PropsWithChildren) => (
  <h4
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-4 text-lg font-bold"
    {...rest}
  >
    {children}
  </h4>
);

const CustomH5 = ({ children, ...rest }: PropsWithChildren) => (
  <h5
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-4 text-base font-bold"
    {...rest}
  >
    {children}
  </h5>
);

const CustomH6 = ({ children, ...rest }: PropsWithChildren) => (
  <h6
    id={slugify(children as string, { lower: true, replacement: "-" })}
    className="mb-4 text-sm font-bold"
    {...rest}
  >
    {children}
  </h6>
);

const CustomParagraph = ({ children, ...rest }: PropsWithChildren) => (
  <p className="mb-4 leading-relaxed" {...rest}>
    {children}
  </p>
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
};
