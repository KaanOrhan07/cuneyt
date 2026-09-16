import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/siparisler/\\[id\\]/pdf": ["./lib/pdf/fonts/**/*"],
    "/api/teklifler/\\[id\\]/pdf": ["./lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
