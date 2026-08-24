import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=()",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;

