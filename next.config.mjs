
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: '',
  assetPrefix: `/${repo}/`,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
