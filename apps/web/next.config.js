const { createContentlayerPlugin } = require("next-contentlayer");
const nextIntlPlugin = require("next-intl/plugin");

const withNextIntl = nextIntlPlugin("./i18n.ts");
const withContentlayer = createContentlayerPlugin({});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["api"],
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  experimental: {
    serverActions: true,
    outputFileTracingExcludes: {
      "*": [
        "node_modules/@swc/core-linux-x64-gnu",
        "node_modules/@swc/core-linux-x64-musl",
        "node_modules/@esbuild/linux-x64",
      ],
    },
  },
};

module.exports = withNextIntl(withContentlayer(nextConfig));
