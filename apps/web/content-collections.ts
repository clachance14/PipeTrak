import { defineCollection, defineConfig } from "@content-collections/core";
import { compile } from "@mdx-js/mdx";

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "**/*.{mdx,md}",
  schema: (z) => ({
    title: z.string(),
    date: z.string().transform((val) => new Date(val)),
    image: z.string().optional(),
    authorName: z.string(),
    authorImage: z.string().optional(),
    authorLink: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()),
    published: z.boolean(),
  }),
  transform: async ({ content, _meta, ...data }) => {
    const body = String(
      await compile(content, {
        outputFormat: "function-body",
      }),
    );

    const slug = _meta.path;

    return {
      ...data,
      body,
      slug,
    };
  },
});

const legalPages = defineCollection({
  name: "legalPages",
  directory: "content/legal",
  include: "**/*.{mdx,md}",
  schema: (z) => ({
    title: z.string(),
  }),
  transform: async ({ content, _meta, ...data }) => {
    const body = String(
      await compile(content, {
        outputFormat: "function-body",
      }),
    );

    const slug = _meta.path;

    return {
      ...data,
      body,
      slug,
    };
  },
});

export default defineConfig({
  collections: [posts, legalPages],
});
