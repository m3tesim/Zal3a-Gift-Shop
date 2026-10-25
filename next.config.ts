import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads are already resized to WebP when saved, and served from /uploads by a route handler.
  images: { unoptimized: true },
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
};

export default nextConfig;
