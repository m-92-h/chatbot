import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تفعيل standalone output للنشر على Vercel/Docker
  // output: "standalone",

  // تفعيل دعم TypeScript الصارم
  typescript: {
    ignoreBuildErrors: false,
  },

  // الحزم التي يجب أن تعمل على الخادم فقط (لا تُرسل للمتصفح)
   serverExternalPackages: [
    "@google/genai",
    "@modelcontextprotocol/sdk",
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "pgvector",
  ],
};

export default nextConfig;