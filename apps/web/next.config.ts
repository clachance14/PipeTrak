import { withContentCollections } from "@content-collections/next";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import type { NextConfig } from "next";

import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
	transpilePackages: ["@repo/api", "@repo/auth", "@repo/database"],
	experimental: {
		serverComponentsExternalPackages: ["@prisma/client", "prisma"],
		...(process.env.VERCEL && {
			outputFileTracingIncludes: {
				"/api/**/*": [
					"../../packages/database/prisma/generated/client/**/*.so.node",
					"./prisma/generated/client/**/*.so.node",
				],
			},
		}),
	},
	// Vercel deployment optimizations for Prisma
	...(process.env.VERCEL && {
		output: "standalone",
		outputFileTracing: true,
	}),
	// Development optimizations to reduce ENOENT errors
	...(process.env.NODE_ENV === "development" && {
		onDemandEntries: {
			maxInactiveAge: 60 * 1000,
			pagesBufferLength: 2,
		},
		generateBuildId: () => "development",
	}),
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
				source: "/",
				destination: "/en",
				permanent: false,
			},
			{
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/:organizationSlug/settings",
				destination: "/app/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
		];
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	webpack: (config, { webpack, isServer, dev }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		if (isServer) {
			config.plugins.push(new PrismaPlugin());

			// Ensure Prisma query engine binaries are included in output
			config.resolve.alias = {
				...config.resolve.alias,
				"@prisma/client": require.resolve(
					"@repo/database/prisma/generated/client",
				),
			};

			// Add Prisma library engines to webpack externals
			if (process.env.VERCEL) {
				config.externals = [
					...(config.externals || []),
					// Keep Prisma client internal but ensure library engines are accessible
					{
						"./libquery_engine-rhel-openssl-3.0.x.so.node":
							"commonjs ./libquery_engine-rhel-openssl-3.0.x.so.node",
						"./libquery_engine-debian-openssl-3.0.x.so.node":
							"commonjs ./libquery_engine-debian-openssl-3.0.x.so.node",
					},
				];
			}
		}

		// Development-specific optimizations to reduce ENOENT errors
		if (dev) {
			// Reduce file system pressure in development
			config.watchOptions = {
				...config.watchOptions,
				poll: false,
				aggregateTimeout: 300,
				ignored: [
					"**/node_modules/**",
					"**/.git/**",
					"**/.next/**",
					"**/dist/**",
				],
			};

			// Optimize output to reduce temporary file conflicts
			config.output = {
				...config.output,
				hashFunction: "xxhash64",
			};
		}

		return config;
	},
};

export default withNextIntl(withContentCollections(nextConfig));
