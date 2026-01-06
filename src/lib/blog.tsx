// 博客文章元数据
interface BlogPostFrontmatter {
  title: string;
  date: string;
  authors: ({ name: string; pubkey?: string } | string)[];
  description?: string;
  tags?: string[];
}

export const modules = import.meta.glob<{
  frontmatter: BlogPostFrontmatter;
  default: any;
}>("../../blog/*.mdx", { eager: true });

export const blogPosts = Object.entries(modules).map(([path, mod]) => {
  const key = path.replace("../../../blog/", "").replace(".mdx", "");
  const slug = key.split("-").slice(1).join("-");

  return {
    key,
    slug,
    frontmatter: mod.frontmatter,
    Content: mod.default,
  };
});
