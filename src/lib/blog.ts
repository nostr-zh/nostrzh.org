// 博客文章元数据
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  authors: string[];
  description?: string;
  tags?: string[];
}

// 导入所有 MDX 文件
const modules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter: Omit<BlogPost, "slug">;
}>("../../blog/*.mdx", { eager: true });

// 解析所有文章
export const blogPosts: BlogPost[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.replace("../../blog/", "").replace(".mdx", "");
    return {
      slug,
      ...module.frontmatter,
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 获取单篇文章组件
export function getBlogPost(slug: string) {
  const path = `../../blog/${slug}.mdx`;
  const module = modules[path];
  if (!module) return null;
  return {
    Component: module.default,
    frontmatter: module.frontmatter,
  };
}

// 获取所有文章
export function getAllPosts() {
  return blogPosts;
}

// 根据标签筛选文章
export function getPostsByTag(tag: string) {
  return blogPosts.filter((post) => post.tags?.includes(tag));
}
