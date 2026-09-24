import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bank screenshot uploads for the AI transaction importer.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
