import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships runtime data files — load from node_modules, don't bundle.
  serverExternalPackages: ["pdfkit"],
  // Fonts are read from disk at runtime; serverless file-tracing can't see
  // that statically, so include them explicitly for the document routes.
  outputFileTracingIncludes: {
    "/api/doc-orders": ["./assets/fonts/**"],
    "/api/doc-orders/[id]/pay": ["./assets/fonts/**"],
    "/api/doc-orders/[id]/download": ["./assets/fonts/**"],
  },
};

export default nextConfig;
