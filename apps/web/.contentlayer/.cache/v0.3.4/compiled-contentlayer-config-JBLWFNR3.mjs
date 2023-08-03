// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
var Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    image: { type: "string" },
    authorName: { type: "string", required: true },
    authorImage: { type: "string" },
    authorLink: { type: "string" },
    excerpt: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    published: { type: "boolean" }
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/blog/${post._raw.flattenedPath}`
    },
    slug: { type: "string", resolve: (post) => post._raw.flattenedPath }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content/posts",
  documentTypes: [Post]
});
export {
  Post,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-JBLWFNR3.mjs.map
