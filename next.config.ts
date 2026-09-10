import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.5'],
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-math', {}]],
    rehypePlugins: [['rehype-katex', {}]],
  },
})

export default withMDX(nextConfig);
