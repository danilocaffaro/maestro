import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["child_process", "readline", "events", "better-sqlite3"],
};

export default nextConfig;
