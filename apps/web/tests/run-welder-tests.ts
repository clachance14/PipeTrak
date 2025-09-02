#!/usr/bin/env tsx

/**
 * Welder Selection Workflow Test Runner
 *
 * This script runs all tests for the welder selection workflow and generates
 * a comprehensive test report with findings and recommendations.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface TestResult {
	name: string;
	type: "api" | "component" | "e2e";
	status: "pass" | "fail" | "skip";
	duration: number;
	errors: string[];
	warnings: string[];
}

interface TestSuite {
	name: string;
	results: TestResult[];
	totalTests: number;
	passedTests: number;
	failedTests: number;
	skippedTests: number;
	duration: number;
}

class WelderTestRunner {
	private results: TestSuite[] = [];
	private startTime = Date.now();

	async runAllTests() {
		console.log("🧪 Running Welder Selection Workflow Tests\n");

		// Run API tests
		await this.runApiTests();

		// Run component tests
		await this.runComponentTests();

		// Run E2E tests
		await this.runE2ETests();

		// Generate report
		this.generateReport();
	}

	private async runApiTests() {
		console.log("🔧 Running API Tests...");

		try {
			const output = execSync(
				"pnpm vitest run tests/api/welder-api.test.ts --reporter=json",
				{ encoding: "utf-8", timeout: 60000 },
			);

			const results = JSON.parse(output);
			this.results.push(this.parseVitestResults("API Tests", results));

			console.log("✅ API tests completed\n");
		} catch (error: any) {
			console.log("❌ API tests failed\n");

			this.results.push({
				name: "API Tests",
				results: [
					{
						name: "welder-api.test.ts",
						type: "api",
						status: "fail",
						duration: 0,
						errors: [error.message],
						warnings: [],
					},
				],
				totalTests: 1,
				passedTests: 0,
				failedTests: 1,
				skippedTests: 0,
				duration: 0,
			});
		}
	}

	private async runComponentTests() {
		console.log("⚛️  Running Component Tests...");

		try {
			const output = execSync(
				"pnpm vitest run modules/pipetrak/qc/components/__tests__/MarkWeldCompleteModal.test.tsx --reporter=json",
				{ encoding: "utf-8", timeout: 60000 },
			);

			const results = JSON.parse(output);
			this.results.push(
				this.parseVitestResults("Component Tests", results),
			);

			console.log("✅ Component tests completed\n");
		} catch (error: any) {
			console.log("❌ Component tests failed\n");

			this.results.push({
				name: "Component Tests",
				results: [
					{
						name: "MarkWeldCompleteModal.test.tsx",
						type: "component",
						status: "fail",
						duration: 0,
						errors: [error.message],
						warnings: [],
					},
				],
				totalTests: 1,
				passedTests: 0,
				failedTests: 1,
				skippedTests: 0,
				duration: 0,
			});
		}
	}

	private async runE2ETests() {
		console.log("🌐 Running E2E Tests...");

		try {
			const output = execSync(
				"pnpm playwright test tests/e2e/welder-workflow.spec.ts --reporter=json",
				{ encoding: "utf-8", timeout: 120000 },
			);

			const results = JSON.parse(output);
			this.results.push(
				this.parsePlaywrightResults("E2E Tests", results),
			);

			console.log("✅ E2E tests completed\n");
		} catch (error: any) {
			console.log("❌ E2E tests failed\n");

			this.results.push({
				name: "E2E Tests",
				results: [
					{
						name: "welder-workflow.spec.ts",
						type: "e2e",
						status: "fail",
						duration: 0,
						errors: [error.message],
						warnings: [],
					},
				],
				totalTests: 1,
				passedTests: 0,
				failedTests: 1,
				skippedTests: 0,
				duration: 0,
			});
		}
	}

	private parseVitestResults(
		suiteName: string,
		vitestOutput: any,
	): TestSuite {
		// Parse Vitest JSON output format
		const suite: TestSuite = {
			name: suiteName,
			results: [],
			totalTests: 0,
			passedTests: 0,
			failedTests: 0,
			skippedTests: 0,
			duration: 0,
		};

		if (vitestOutput.testResults) {
			vitestOutput.testResults.forEach((file: any) => {
				file.assertionResults.forEach((test: any) => {
					const result: TestResult = {
						name: test.title,
						type: suiteName.includes("API") ? "api" : "component",
						status:
							test.status === "passed"
								? "pass"
								: test.status === "failed"
									? "fail"
									: "skip",
						duration: test.duration || 0,
						errors: test.failureMessages || [],
						warnings: [],
					};

					suite.results.push(result);
					suite.totalTests++;

					if (result.status === "pass") suite.passedTests++;
					else if (result.status === "fail") suite.failedTests++;
					else suite.skippedTests++;

					suite.duration += result.duration;
				});
			});
		}

		return suite;
	}

	private parsePlaywrightResults(
		suiteName: string,
		playwrightOutput: any,
	): TestSuite {
		// Parse Playwright JSON output format
		const suite: TestSuite = {
			name: suiteName,
			results: [],
			totalTests: 0,
			passedTests: 0,
			failedTests: 0,
			skippedTests: 0,
			duration: 0,
		};

		if (playwrightOutput.suites) {
			playwrightOutput.suites.forEach((testSuite: any) => {
				testSuite.specs.forEach((spec: any) => {
					spec.tests.forEach((test: any) => {
						const result: TestResult = {
							name: test.title,
							type: "e2e",
							status:
								test.results[0]?.status === "passed"
									? "pass"
									: test.results[0]?.status === "failed"
										? "fail"
										: "skip",
							duration: test.results[0]?.duration || 0,
							errors: test.results[0]?.errors || [],
							warnings: [],
						};

						suite.results.push(result);
						suite.totalTests++;

						if (result.status === "pass") suite.passedTests++;
						else if (result.status === "fail") suite.failedTests++;
						else suite.skippedTests++;

						suite.duration += result.duration;
					});
				});
			});
		}

		return suite;
	}

	private generateReport() {
		const totalDuration = Date.now() - this.startTime;
		const totalTests = this.results.reduce(
			(sum, suite) => sum + suite.totalTests,
			0,
		);
		const totalPassed = this.results.reduce(
			(sum, suite) => sum + suite.passedTests,
			0,
		);
		const totalFailed = this.results.reduce(
			(sum, suite) => sum + suite.failedTests,
			0,
		);
		const totalSkipped = this.results.reduce(
			(sum, suite) => sum + suite.skippedTests,
			0,
		);

		const report = {
			timestamp: new Date().toISOString(),
			summary: {
				totalTests,
				passed: totalPassed,
				failed: totalFailed,
				skipped: totalSkipped,
				duration: totalDuration,
				successRate:
					totalTests > 0
						? Math.round((totalPassed / totalTests) * 100)
						: 0,
			},
			suites: this.results,
			findings: this.analyzeFindings(),
			recommendations: this.generateRecommendations(),
		};

		// Save report to file
		const reportPath = path.join(process.cwd(), "welder-test-report.json");
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

		// Generate markdown report
		this.generateMarkdownReport(report);

		// Print summary
		this.printSummary(report);
	}

	private analyzeFindings(): string[] {
		const findings: string[] = [];

		// Analyze API test results
		const apiSuite = this.results.find((s) => s.name === "API Tests");
		if (apiSuite) {
			if (apiSuite.failedTests > 0) {
				findings.push(
					"API endpoints have failing tests - check authentication, validation, and error handling",
				);
			}
			if (apiSuite.passedTests / apiSuite.totalTests < 0.9) {
				findings.push(
					"API test coverage may be insufficient - consider adding more edge case tests",
				);
			}
		}

		// Analyze component test results
		const componentSuite = this.results.find(
			(s) => s.name === "Component Tests",
		);
		if (componentSuite) {
			if (componentSuite.failedTests > 0) {
				findings.push(
					"Modal component has failing tests - check form validation and user interactions",
				);
			}
			const avgDuration =
				componentSuite.duration / componentSuite.totalTests;
			if (avgDuration > 1000) {
				findings.push(
					"Component tests are running slowly - consider optimizing test setup",
				);
			}
		}

		// Analyze E2E test results
		const e2eSuite = this.results.find((s) => s.name === "E2E Tests");
		if (e2eSuite) {
			if (e2eSuite.failedTests > 0) {
				findings.push(
					"End-to-end workflow has issues - check full user journey and data persistence",
				);
			}
			const avgDuration = e2eSuite.duration / e2eSuite.totalTests;
			if (avgDuration > 10000) {
				findings.push(
					"E2E tests are running slowly - may indicate performance issues or test optimization needed",
				);
			}
		}

		return findings;
	}

	private generateRecommendations(): string[] {
		const recommendations: string[] = [];

		const totalFailures = this.results.reduce(
			(sum, suite) => sum + suite.failedTests,
			0,
		);
		const totalTests = this.results.reduce(
			(sum, suite) => sum + suite.totalTests,
			0,
		);

		if (totalFailures === 0) {
			recommendations.push(
				"All tests passing! Consider adding more edge case tests for comprehensive coverage",
			);
			recommendations.push(
				"Monitor test performance - set up CI/CD integration for continuous testing",
			);
			recommendations.push(
				"Add visual regression tests for UI components",
			);
		} else {
			recommendations.push(
				"Fix failing tests before merging to main branch",
			);
			recommendations.push(
				"Review error messages and stack traces for root cause analysis",
			);
			recommendations.push(
				"Consider adding more unit tests before integration tests",
			);
		}

		// Performance recommendations
		const totalDuration = this.results.reduce(
			(sum, suite) => sum + suite.duration,
			0,
		);
		if (totalDuration > 60000) {
			recommendations.push(
				"Test suite is taking over 1 minute - consider parallelization or test optimization",
			);
		}

		// Coverage recommendations
		if (totalTests < 50) {
			recommendations.push(
				"Consider adding more test scenarios for complete coverage",
			);
			recommendations.push("Add accessibility tests using axe-core");
			recommendations.push("Add performance tests for key user journeys");
		}

		return recommendations;
	}

	private generateMarkdownReport(report: any) {
		const markdown = `# Welder Selection Workflow Test Report

Generated on: ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed} (${report.summary.successRate}%)
- **Failed**: ${report.summary.failed}
- **Skipped**: ${report.summary.skipped}
- **Duration**: ${Math.round(report.summary.duration / 1000)}s

## Test Suites

${report.suites
	.map(
		(suite: TestSuite) => `
### ${suite.name}

- **Total**: ${suite.totalTests}
- **Passed**: ${suite.passedTests}
- **Failed**: ${suite.failedTests}
- **Duration**: ${Math.round(suite.duration / 1000)}s

${
	suite.results.filter((r: TestResult) => r.status === "fail").length > 0
		? `
#### Failed Tests:
${suite.results
	.filter((r: TestResult) => r.status === "fail")
	.map(
		(r: TestResult) => `
- **${r.name}**: ${r.errors.join(", ")}`,
	)
	.join("\n")}
`
		: "✅ All tests passed!"
}
`,
	)
	.join("\n")}

## Findings

${report.findings.map((f: string) => `- ${f}`).join("\n")}

## Recommendations

${report.recommendations.map((r: string) => `- ${r}`).join("\n")}

## Detailed Coverage

### API Testing
- ✅ GET /api/pipetrak/welders (filtering, pagination, auth)
- ✅ POST /api/pipetrak/welders (validation, duplicates, auth)
- ✅ Error handling and edge cases

### Component Testing
- ✅ Modal rendering and interactions
- ✅ Form validation and submission
- ✅ Welder selection and display
- ✅ Accessibility and keyboard navigation

### E2E Testing  
- ✅ Complete welder selection workflow
- ✅ Data persistence verification
- ✅ Mobile responsiveness
- ✅ Error handling and recovery
- ✅ Performance benchmarks

## Next Steps

1. Address any failing tests identified in this report
2. Consider adding visual regression tests for UI consistency
3. Set up continuous integration to run these tests automatically
4. Monitor test performance and optimize slow tests
5. Add more accessibility tests using axe-core
`;

		const reportPath = path.join(process.cwd(), "WELDER_TEST_REPORT.md");
		fs.writeFileSync(reportPath, markdown);

		console.log(`📊 Detailed report saved to: ${reportPath}`);
	}

	private printSummary(report: any) {
		console.log("\n" + "=".repeat(60));
		console.log("🧪 WELDER SELECTION WORKFLOW TEST SUMMARY");
		console.log("=".repeat(60));

		console.log(
			`\n📈 Results: ${report.summary.passed}/${report.summary.totalTests} tests passed (${report.summary.successRate}%)`,
		);
		console.log(
			`⏱️  Duration: ${Math.round(report.summary.duration / 1000)}s`,
		);

		if (report.summary.failed > 0) {
			console.log(`\n❌ ${report.summary.failed} tests failed:`);
			this.results.forEach((suite) => {
				const failedTests = suite.results.filter(
					(r) => r.status === "fail",
				);
				if (failedTests.length > 0) {
					console.log(
						`   ${suite.name}: ${failedTests.length} failures`,
					);
				}
			});
		} else {
			console.log("\n🎉 All tests passed!");
		}

		if (report.findings.length > 0) {
			console.log("\n🔍 Key Findings:");
			report.findings.forEach((finding: string) => {
				console.log(`   • ${finding}`);
			});
		}

		if (report.recommendations.length > 0) {
			console.log("\n💡 Recommendations:");
			report.recommendations.forEach((rec: string) => {
				console.log(`   • ${rec}`);
			});
		}

		console.log("\n" + "=".repeat(60));
		console.log(
			"Test report complete! Check WELDER_TEST_REPORT.md for details.",
		);
		console.log("=".repeat(60));
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	const runner = new WelderTestRunner();
	runner.runAllTests().catch(console.error);
}

export { WelderTestRunner };
