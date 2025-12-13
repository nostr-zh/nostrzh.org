declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    date: string;
    authors: string[];
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
