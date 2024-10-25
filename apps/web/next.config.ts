import { withContentCollections } from "@content-collections/next";
import { config } from "@repo/config";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	transpilePackages: ["@repo/api", "@repo/auth"],
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/organization-settings",
				destination: "/app/organization-settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
			...(!config.ui.saas.enabled
				? [
						{
							source: "/app/:path*",
							destination: "/",
							permanent: false,
						},
					]
				: []),
			...(!config.ui.marketing.enabled
				? [
						{
							source: "/:path((?!app|auth|api).*)*",
							destination: "/app",
							permanent: false,
						},
					]
				: []),
		];
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default withContentCollections(withNextIntl(nextConfig));
