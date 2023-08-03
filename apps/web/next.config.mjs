import { withContentlayer } from "next-contentlayer";
import nextIntlPlugin from "next-intl/plugin";
import "./env.mjs";
const withNextIntl = nextIntlPlugin("./i18n.ts");

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

export default withNextIntl(withContentlayer(nextConfig));
