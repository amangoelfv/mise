import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Cloud Run container (see Dockerfile, DEPLOY.md).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
