const withNextIntl = require("next-intl/plugin")("./i18n.ts");

const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["ui"],
  experimental: {
    serverActions: true,
  },
};

module.exports = withNextIntl(withContentlayer(nextConfig));
