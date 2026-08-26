import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/public-info/:id",
        destination: "/scan/:id",
        permanent: true,
      },
      {
        source: "/rekonsiliasi",
        destination: "/rekonsiliasi/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
