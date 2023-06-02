# Blog module

This module provides a blog functionality with for the application.

## Setup

To set up the module, you first need to create the pages for the blog.

In your /pages directory, create a new folder called "blog". In this folder create two new files:

_index.tsx_
```typescript
import { BlogPage } from "@blog/client";

export default BlogPage;
```

_[slug].tsx_
```typescript
import { BlogPostPage } from "@blog/client";

export default BlogPostPage;
```