import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // /api/run is handled by src/app/api/run/route.ts (long timeout)
      {
        source: "/api/models",
        destination: "http://127.0.0.1:8000/api/models",
      },
      {
        source: "/api/health",
        destination: "http://127.0.0.1:8000/api/health",
      },
    ];
  },
};

export default nextConfig;
