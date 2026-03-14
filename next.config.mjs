/** @type {import('next').NextConfig} */
const BACKEND_URL = "http://10.0.0.50"
const BACKEND_PORT = "8080"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}:${BACKEND_PORT}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
