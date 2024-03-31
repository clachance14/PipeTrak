import { ContentMenu } from "@marketing/shared/components/ContentMenu";
import { getContentStructure } from "@shared/lib/content";
import {
  allDocumentationMetas,
  allDocumentationPages,
} from "content-collections";
import { useLocale } from "next-intl";
import type { PropsWithChildren } from "react";

export default async function DocsLayout({
  children,
  params: { path },
}: PropsWithChildren<{ params: { path: string | string[] } }>) {
  const locale = useLocale();

  const activePath = Array.isArray(path) ? path.join("/") : path || "";

  const contentStructure = getContentStructure({
    documents: allDocumentationPages,
    meta: allDocumentationMetas,
    locale,
  });

  return (
    <div className="container">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_auto]">
        <ContentMenu items={contentStructure} activePath={activePath} />

        <div>{children}</div>
      </div>
    </div>
  );
}
