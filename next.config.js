/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    webpackBuildWorker: false
  }
};

module.exports = nextConfig;
