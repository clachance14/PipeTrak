const { createContentlayerPlugin } = require("next-contentlayer");
const nextIntlPlugin = require("next-intl/plugin");
import("./env.mjs");

const withNextIntl = nextIntlPlugin("./i18n.ts");
const withContentlayer = createContentlayerPlugin({});

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

module.exports = withNextIntl(withContentlayer(nextConfig));
