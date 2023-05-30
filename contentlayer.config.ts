import { defineDocumentType, makeSource } from '@contentlayer/source-files';

export const BlogPost = defineDocumentType(() => ({
  name: 'BlogPost',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    image: { type: 'string' },
    authorName: { type: 'string', required: true },
    authorImage: { type: 'string' },
    authorLink: { type: 'string' },
    excerpt: { type: 'string' },
    tags: { type: 'list', of: { type: 'string' } },
    published: { type: 'boolean' },
  },
  computedFields: {
    url: { type: 'string', resolve: (post) => `/blog/${post._raw.flattenedPath}` },
    slug: { type: 'string', resolve: (post) => post._raw.flattenedPath },
  },
}));

export default makeSource({ contentDirPath: 'content/blog', documentTypes: [BlogPost] });
