export type BlogPost = {
  slug: string;
  title: string;
  excerpt?: string;
  contentType: 'mdx' | 'html';
  content: string;
  author?: {
    name: string;
    link?: string;
    image?: string;
  };
  createdAt: string;
};
