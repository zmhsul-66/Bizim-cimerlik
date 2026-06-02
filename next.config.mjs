/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.2.172', '192.168.2.172:3000', 'localhost:3000'],
};

export default nextConfig;
