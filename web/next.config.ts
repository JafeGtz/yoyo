import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz a este proyecto (convive con el repo hermano de la app RN).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
