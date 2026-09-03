import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["juice", "nodemailer", "@prisma/client"],
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
