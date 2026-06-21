import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  redirects: async () => [
    {
      source: "/",
      destination: "/tn",
      permanent: true,
    },
    {
      source: "/district/:slug",
      destination: "/tn/districts/:slug",
      permanent: true,
    },
    {
      source: "/constituency/:slug",
      destination: "/tn/constituency/:slug",
      permanent: true,
    },
    {
      source: "/mla/list",
      destination: "/tn/mla/list",
      permanent: true,
    },
    {
      source: "/mla/:slug",
      destination: "/tn/mla/:slug",
      permanent: true,
    },
    {
      source: "/parties/:slug",
      has: [
        {
          type: "query",
          key: "election",
          value: "(?<year>\\d{4})",
        },
      ],
      destination: "/parties/:slug/:year",
      permanent: true,
    },
    {
      source: "/parties/:slug",
      has: [
        {
          type: "query",
          key: "election",
          value: "all",
        },
      ],
      destination: "/parties/:slug",
      permanent: true,
    },
  ],
};

export default nextConfig;
