const withNextIntl = require('next-intl/plugin')('./i18n.ts');
const { withContentlayer } = require('next-contentlayer');

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mjml'],
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
};

module.exports = withNextIntl(withContentlayer(nextConfig));
