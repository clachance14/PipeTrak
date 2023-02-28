export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  author: {
    name: string;
    link?: string;
    image?: string;
  };
  createdAt: string;
};
