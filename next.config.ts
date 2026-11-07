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
    // Vietnamese letters inside \text{...} only lack KaTeX font metrics (they still render);
    // the content check scripts catch Vietnamese letters in math mode separately.
    rehypePlugins: [['rehype-katex', { strict: 'ignore' }]],
  },
})

export default withMDX(nextConfig);
