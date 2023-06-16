/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["ui"],
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["mjml"],
  },
};

module.exports = nextConfig;
