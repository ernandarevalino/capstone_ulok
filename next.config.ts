import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.100.89:3000',
    '192.168.1.7:3000',
    '192.168.100.89',
    '192.168.1.7',
    '192.168.1.4',
    '192.168.1.4:3000'
  ]
};

export default nextConfig;