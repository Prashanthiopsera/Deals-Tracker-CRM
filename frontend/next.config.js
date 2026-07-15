/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained build under .next/standalone — required for Docker
  output: 'standalone',
};

module.exports = nextConfig;
