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
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/app/dashboard",
        permanent: true,
      },
      {
        source: "/app/settings",
        destination: "/app/settings/account/general",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(withContentlayer(nextConfig));
