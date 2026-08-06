import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.6:3000',
    '192.168.1.6',
    '10.121.201.28:3000',
    '10.121.201.28',
    '10.83.63.28:3000',
    '10.83.63.28' 
  ]
};

export default nextConfig;