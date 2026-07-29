import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot
  },
  trailingSlash: false,
  async rewrites() {
    return [
      { source: "/deck", destination: "/slides/index.html" },
      { source: "/presentation", destination: "/slides/index.html" }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
