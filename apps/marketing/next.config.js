const withNextTranslate = require("next-translate-plugin");
const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["ui"],
  experimental: {
    serverActions: true,
  },
};

module.exports = withNextTranslate(withContentlayer(nextConfig));
