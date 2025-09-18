import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test-setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				".next/**",
				"**/*.config.*",
				"**/*.d.ts",
				"**/__tests__/**",
				"**/__mocks__/**",
			],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
		include: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
		exclude: ["node_modules", ".next", "tests/**", "e2e/**"], // tests and e2e folders are for Playwright
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
			"@modules": path.resolve(__dirname, "./modules"),
			"@ui": path.resolve(__dirname, "./modules/ui"),
			"@pipetrak": path.resolve(__dirname, "./modules/pipetrak"),
			"@saas": path.resolve(__dirname, "./modules/saas"),
			"@shared": path.resolve(__dirname, "./modules/shared"),
			"@repo": path.resolve(__dirname, "../../packages"),
		},
	},
});
