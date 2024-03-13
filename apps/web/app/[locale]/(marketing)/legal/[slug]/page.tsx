import { PostContent } from "@marketing/blog/components/PostContent";
import { allLegalPages } from "content-collections";
import { redirect } from "next/navigation";

type Params = {
  slug: string;
};

export async function generateMetadata({
  params: { slug },
}: {
  params: Params;
}) {
  const post = allLegalPages.find((post) => post.slug === slug);

  return {
    title: post?.title,
    openGraph: {
      title: post?.title,
    },
  };
}

export default async function BlogPostPage({
  params: { slug },
}: {
  params: Params;
}) {
  const page = allLegalPages.find((page) => page.slug === slug);

  if (!page) {
    redirect("/");
  }

  const { title, body } = page;

  return (
    <div className="container max-w-6xl pb-24">
      <div className="mx-auto mb-12 max-w-2xl">
        <h1 className="text-center text-4xl font-bold">{title}</h1>
      </div>

      <PostContent content={body} />
    </div>
  );
}
