import { apiClient } from "@shared/lib/api-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	bulkUpdateComponents,
	exportComponents,
	getComponentDetails,
	getComponents,
	updateComponentMilestone,
} from "../lib/actions";

// Mock the API client
vi.mock("@modules/shared/lib/api-client", () => ({
	apiClient: {
		pipetrak: {
			components: {
				$get: vi.fn(),
				":id": {
					$get: vi.fn(),
					$patch: vi.fn(),
				},
				bulk: {
					$patch: vi.fn(),
				},
				export: {
					$get: vi.fn(),
				},
			},
			milestones: {
				":id": {
					$patch: vi.fn(),
				},
			},
		},
	},
}));

// Mock console methods to avoid noise in tests
const mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

describe("API Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getComponents", () => {
		it("should fetch and transform components successfully", async () => {
			const mockComponents = [
				{
					id: "comp-1",
					componentId: "VALVE-401",
					type: "VALVE",
					spec: "ANSI 150",
					size: '6"',
					drawing: { number: "P-35F11" },
					description: "",
				},
				{
					id: "comp-2",
					componentId: "PIPE-402",
					type: "PIPE",
					spec: "ANSI 300",
					size: '8"',
					drawingId: "P-35F12",
					description: "Process pipe",
				},
			];

			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockComponents),
			};

			(apiClient.pipetrak.components.$get as any).mockResolvedValue(
				mockResponse,
			);

			const result = await getComponents("proj-1");

			expect(apiClient.pipetrak.components.$get).toHaveBeenCalledWith({
				query: { projectId: "proj-1", limit: "10000" },
			});

			expect(result).toHaveLength(2);
			expect(result[0].drawingNumber).toBe("P-35F11");
			expect(result[0].description).toBe('VALVE ANSI 150 6"');
			expect(result[1].drawingNumber).toBe("P-35F12");
			expect(result[1].description).toBe("Process pipe");
		});

		it("should handle API errors gracefully", async () => {
			const mockResponse = {
				ok: false,
			};

			(apiClient.pipetrak.components.$get as any).mockResolvedValue(
				mockResponse,
			);

			const result = await getComponents("proj-1");

			expect(result).toEqual([]);
			expect(mockConsoleError).toHaveBeenCalledWith(
				"Failed to fetch components",
			);
		});

		it("should handle network errors gracefully", async () => {
			(apiClient.pipetrak.components.$get as any).mockRejectedValue(
				new Error("Network error"),
			);

			const result = await getComponents("proj-1");

			expect(result).toEqual([]);
			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error fetching components:",
				expect.any(Error),
			);
		});

		it("should handle components without drawing information", async () => {
			const mockComponents = [
				{
					id: "comp-1",
					componentId: "VALVE-401",
					type: "VALVE",
					spec: "",
					size: "",
					description: "",
				},
			];

			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockComponents),
			};

			(apiClient.pipetrak.components.$get as any).mockResolvedValue(
				mockResponse,
			);

			const result = await getComponents("proj-1");

			expect(result[0].drawingNumber).toBe("-");
			expect(result[0].description).toBe("VALVE");
		});
	});

	describe("updateComponentMilestone", () => {
		it("should update milestone successfully", async () => {
			const mockResponse = {
				ok: true,
			};

			(
				apiClient.pipetrak.milestones[":id"].$patch as any
			).mockResolvedValue(mockResponse);

			await updateComponentMilestone("comp-1", "milestone-1", {
				isCompleted: true,
				percentageValue: 100,
			});

			expect(
				apiClient.pipetrak.milestones[":id"].$patch,
			).toHaveBeenCalledWith({
				param: { id: "milestone-1" },
				json: {
					isCompleted: true,
					percentageValue: 100,
				},
			});
		});

		it("should throw error when update fails", async () => {
			const mockResponse = {
				ok: false,
			};

			(
				apiClient.pipetrak.milestones[":id"].$patch as any
			).mockResolvedValue(mockResponse);

			await expect(
				updateComponentMilestone("comp-1", "milestone-1", {
					isCompleted: true,
				}),
			).rejects.toThrow("Failed to update milestone");

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error updating milestone:",
				expect.any(Error),
			);
		});

		it("should handle network errors", async () => {
			(
				apiClient.pipetrak.milestones[":id"].$patch as any
			).mockRejectedValue(new Error("Network error"));

			await expect(
				updateComponentMilestone("comp-1", "milestone-1", {
					quantityValue: 5,
				}),
			).rejects.toThrow("Network error");

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error updating milestone:",
				expect.any(Error),
			);
		});
	});

	describe("getComponentDetails", () => {
		it("should fetch and transform component details successfully", async () => {
			const mockComponent = {
				id: "comp-1",
				componentId: "VALVE-401",
				type: "VALVE",
				spec: "ANSI 150",
				size: '6"',
				drawing: { number: "P-35F11" },
				description: "",
			};

			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockComponent),
			};

			(
				apiClient.pipetrak.components[":id"].$get as any
			).mockResolvedValue(mockResponse);

			const result = await getComponentDetails("comp-1");

			expect(
				apiClient.pipetrak.components[":id"].$get,
			).toHaveBeenCalledWith({
				param: { id: "comp-1" },
			});

			expect(result).not.toBeNull();
			expect(result?.drawingNumber).toBe("P-35F11");
			expect(result?.description).toBe('VALVE ANSI 150 6"');
		});

		it("should return null when API call fails", async () => {
			const mockResponse = {
				ok: false,
			};

			(
				apiClient.pipetrak.components[":id"].$get as any
			).mockResolvedValue(mockResponse);

			const result = await getComponentDetails("comp-1");

			expect(result).toBeNull();
			expect(mockConsoleError).toHaveBeenCalledWith(
				"Failed to fetch component details",
			);
		});

		it("should handle network errors gracefully", async () => {
			(
				apiClient.pipetrak.components[":id"].$get as any
			).mockRejectedValue(new Error("Network error"));

			const result = await getComponentDetails("comp-1");

			expect(result).toBeNull();
			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error fetching component details:",
				expect.any(Error),
			);
		});

		it("should handle components with drawingId instead of drawing object", async () => {
			const mockComponent = {
				id: "comp-1",
				componentId: "PIPE-402",
				type: "PIPE",
				spec: "",
				size: "",
				drawingId: "P-35F12",
				description: "Custom description",
			};

			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockComponent),
			};

			(
				apiClient.pipetrak.components[":id"].$get as any
			).mockResolvedValue(mockResponse);

			const result = await getComponentDetails("comp-1");

			expect(result?.drawingNumber).toBe("P-35F12");
			expect(result?.description).toBe("Custom description");
		});
	});

	describe("bulkUpdateComponents", () => {
		it("should bulk update components successfully", async () => {
			const mockResponse = {
				ok: true,
			};

			(
				apiClient.pipetrak.components.bulk.$patch as any
			).mockResolvedValue(mockResponse);

			const componentIds = ["comp-1", "comp-2", "comp-3"];
			const updates = { status: "IN_PROGRESS" as any };

			await bulkUpdateComponents(componentIds, updates);

			expect(
				apiClient.pipetrak.components.bulk.$patch,
			).toHaveBeenCalledWith({
				json: { componentIds, updates },
			});
		});

		it("should throw error when bulk update fails", async () => {
			const mockResponse = {
				ok: false,
			};

			(
				apiClient.pipetrak.components.bulk.$patch as any
			).mockResolvedValue(mockResponse);

			const componentIds = ["comp-1"];
			const updates = { status: "COMPLETED" as any };

			await expect(
				bulkUpdateComponents(componentIds, updates),
			).rejects.toThrow("Failed to bulk update components");

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error bulk updating components:",
				expect.any(Error),
			);
		});

		it("should handle network errors", async () => {
			(
				apiClient.pipetrak.components.bulk.$patch as any
			).mockRejectedValue(new Error("Network error"));

			const componentIds = ["comp-1", "comp-2"];
			const updates = { testPackage: "TP-002" };

			await expect(
				bulkUpdateComponents(componentIds, updates),
			).rejects.toThrow("Network error");

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error bulk updating components:",
				expect.any(Error),
			);
		});
	});

	describe("exportComponents", () => {
		it("should export components as CSV successfully", async () => {
			const mockBlob = new Blob(["csv data"], { type: "text/csv" });
			const mockResponse = {
				ok: true,
				blob: vi.fn().mockResolvedValue(mockBlob),
			};

			(
				apiClient.pipetrak.components.export.$get as any
			).mockResolvedValue(mockResponse);

			const result = await exportComponents("proj-1", "csv");

			expect(
				apiClient.pipetrak.components.export.$get,
			).toHaveBeenCalledWith({
				query: { projectId: "proj-1", format: "csv" },
			});

			expect(result).toBeInstanceOf(Blob);
			expect(result.type).toBe("text/csv");
		});

		it("should export components as Excel successfully", async () => {
			const mockBlob = new Blob(["excel data"], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const mockResponse = {
				ok: true,
				blob: vi.fn().mockResolvedValue(mockBlob),
			};

			(
				apiClient.pipetrak.components.export.$get as any
			).mockResolvedValue(mockResponse);

			const result = await exportComponents("proj-1", "excel");

			expect(
				apiClient.pipetrak.components.export.$get,
			).toHaveBeenCalledWith({
				query: { projectId: "proj-1", format: "excel" },
			});

			expect(result).toBeInstanceOf(Blob);
		});

		it("should use CSV as default format", async () => {
			const mockBlob = new Blob(["csv data"], { type: "text/csv" });
			const mockResponse = {
				ok: true,
				blob: vi.fn().mockResolvedValue(mockBlob),
			};

			(
				apiClient.pipetrak.components.export.$get as any
			).mockResolvedValue(mockResponse);

			await exportComponents("proj-1");

			expect(
				apiClient.pipetrak.components.export.$get,
			).toHaveBeenCalledWith({
				query: { projectId: "proj-1", format: "csv" },
			});
		});

		it("should throw error when export fails", async () => {
			const mockResponse = {
				ok: false,
			};

			(
				apiClient.pipetrak.components.export.$get as any
			).mockResolvedValue(mockResponse);

			await expect(exportComponents("proj-1")).rejects.toThrow(
				"Failed to export components",
			);

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error exporting components:",
				expect.any(Error),
			);
		});

		it("should handle network errors", async () => {
			(
				apiClient.pipetrak.components.export.$get as any
			).mockRejectedValue(new Error("Network error"));

			await expect(exportComponents("proj-1", "excel")).rejects.toThrow(
				"Network error",
			);

			expect(mockConsoleError).toHaveBeenCalledWith(
				"Error exporting components:",
				expect.any(Error),
			);
		});
	});
});
