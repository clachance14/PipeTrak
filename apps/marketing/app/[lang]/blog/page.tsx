import { allPosts } from "contentlayer/generated";
import useTranslation from "next-translate/useTranslation";
import { PostListItem } from "./PostListItem";

export async function generateMetadata() {
  const { t } = useTranslation("blog");
  return {
    title: t("title"),
  };
}

export default async function BlogListPage() {
  const { t } = useTranslation("blog");
  return (
    <div className="container max-w-5xl py-24">
      <div className="mb-12 pt-8 text-center">
        <h1 className="mb-2 text-5xl font-bold">{t("title")}</h1>
        <p className="text-lg opacity-50">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {allPosts.map((post) => (
          <PostListItem post={post} key={post._id} />
        ))}
      </div>
    </div>
  );
}
