import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /* config options here */
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.2:3000',
    '192.168.1.2'
  ]
};

export default nextConfig;