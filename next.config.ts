import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["juice", "nodemailer", "@prisma/client"],
  agentRules: false,
};

export default nextConfig;
