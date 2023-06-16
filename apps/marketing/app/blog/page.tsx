import { allPosts } from "contentlayer/generated";
import { PostListItem } from "./PostListItem";

export async function generateMetadata({ params: { lang } }) {
  return {
    title: "Blog",
  };
}

export default async function BlogListPage() {
  return (
    <div className="container max-w-5xl py-24">
      <div className="mb-12 pt-8 text-center">
        <h1 className="mb-2 text-5xl font-bold">Blog</h1>
        <p className="text-lg opacity-50">
          Read all the latest updates and news
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {allPosts.map((post) => (
          <PostListItem post={post} key={post._id} />
        ))}
      </div>
    </div>
  );
}
