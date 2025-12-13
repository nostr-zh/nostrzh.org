// 博客文章元数据
interface BlogPostFrontmatter {
  title: string;
  date: string;
  authors: string[];
  description?: string;
  tags?: string[];
}

interface BlogPost {
  key: string;
  slug: string;
  frontmatter: BlogPostFrontmatter;
  Component: React.ComponentType;
}

// 导入所有 MDX 文件
const modules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter: BlogPostFrontmatter;
}>("../../blog/*.mdx", { eager: true });

// 解析所有文章
export const blogPosts: BlogPost[] = Object.entries(modules)
  .map(([path, module]) => {
    const key = path.replace("../../blog/", "").replace(".mdx", "");
    const slug = key.split("-").slice(1).join("-");
    return {
      key,
      slug,
      frontmatter: module.frontmatter,
      Component: module.default,
    };
  })
  .sort((a, b) => b.key.localeCompare(a.key));

// 获取单篇文章组件
export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

// 获取所有文章
export function getAllPosts() {
  return blogPosts;
}

// 根据标签筛选文章
export function getPostsByTag(tag: string) {
  return blogPosts.filter((post) => post.frontmatter.tags?.includes(tag));
}
