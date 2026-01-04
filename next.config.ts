import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from inferring the workspace root incorrectly when parent directories contain lockfiles.
  // This is especially common on Windows monorepo-ish folders (e.g., Documents/Projects).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
