import "./env.mjs";
const withNextIntl = require("next-intl/plugin")("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["ui"],
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = withNextIntl(nextConfig);
