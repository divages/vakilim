import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships font data files that must be loaded from node_modules at
  // runtime rather than bundled — this keeps document generation working.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
