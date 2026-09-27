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
  ],
  async redirects() {
    return [
      {
        source: '/admin/super-admin/branches',
        destination: '/admin/super-admin/settings?tab=branches',
        permanent: true,
      },
      {
        source: '/admin/super-admin/profile',
        destination: '/admin/super-admin/settings?tab=profile',
        permanent: true,
      },
      {
        source: '/admin/super-admin/user-dashboard',
        destination: '/admin/super-admin/clustering',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;