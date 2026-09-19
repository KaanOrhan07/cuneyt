import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Logo / özel PDF şablonu yüklemeleri için (varsayılan 1MB). Vercel istek sınırı 4.5MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
  outputFileTracingIncludes: {
    "/api/siparisler/\\[id\\]/pdf": ["./lib/pdf/fonts/**/*"],
    "/api/teklifler/\\[id\\]/pdf": ["./lib/pdf/fonts/**/*"],
    "/api/tedarik/\\[id\\]/pdf": ["./lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
