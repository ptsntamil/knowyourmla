import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/",
      destination: "/tn",
      permanent: true,
    },
  ],
};

export default nextConfig;
