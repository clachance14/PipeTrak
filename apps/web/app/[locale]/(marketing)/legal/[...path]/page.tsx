import { PostContent } from "@marketing/blog/components/PostContent";
import {
  getActivePathFromUrlParam,
  getLocalizedDocumentWithFallback,
} from "@shared/lib/content";
import { allLegalPages } from "content-collections";
import { redirect } from "next/navigation";

type Params = {
  path: string;
  locale: string;
};

export async function generateMetadata({
  params: { path, locale },
}: {
  params: Params;
}) {
  const activePath = getActivePathFromUrlParam(path);
  const page = getLocalizedDocumentWithFallback(
    allLegalPages,
    activePath,
    locale,
  );

  return {
    title: page?.title,
    openGraph: {
      title: page?.title,
    },
  };
}

export default async function BlogPostPage({
  params: { path, locale },
}: {
  params: Params;
}) {
  const activePath = getActivePathFromUrlParam(path);
  const page = getLocalizedDocumentWithFallback(
    allLegalPages,
    activePath,
    locale,
  );

  if (!page) {
    redirect("/");
  }

  const { title, body } = page;

  return (
    <div className="container max-w-6xl pb-24 pt-32">
      <div className="mx-auto mb-12 max-w-2xl">
        <h1 className="text-center text-4xl font-bold">{title}</h1>
      </div>

      <PostContent content={body} />
    </div>
  );
}
