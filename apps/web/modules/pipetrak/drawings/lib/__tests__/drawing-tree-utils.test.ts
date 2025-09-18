import { describe, expect, it } from "vitest";
import {
	mockComponentCounts,
	mockDeepTree,
	mockFlatDrawings,
	mockOrphanedDrawings,
	mockSimpleTree,
} from "../../__fixtures__/drawings";
import {
	buildDrawingTree,
	countDrawingsInTree,
	filterDrawingTree,
	findDrawingInTree,
	flattenDrawingTree,
	getAllDrawingIds,
	getDrawingPath,
	getExpandedNodeIds,
	getTreeDepth,
	updateDrawingComponentCount,
} from "../drawing-tree-utils";

describe("drawing-tree-utils", () => {
	describe("buildDrawingTree", () => {
		it("should build a tree from flat drawings", () => {
			const tree = buildDrawingTree(
				mockFlatDrawings.map((d) => ({
					...d,
					componentCount: mockComponentCounts.empty,
				})),
			);

			expect(tree).toHaveLength(2); // Two root nodes
			expect(tree[0].children).toHaveLength(2); // First root has 2 children
			expect(tree[0].children[0].children).toHaveLength(1); // First child has 1 child
			expect(tree[1].children).toHaveLength(0); // Second root has no children
		});

		it("should handle empty array", () => {
			const tree = buildDrawingTree([]);
			expect(tree).toEqual([]);
		});

		it("should handle orphaned nodes (missing parents)", () => {
			const tree = buildDrawingTree(
				mockOrphanedDrawings.map((d) => ({
					...d,
					componentCount: mockComponentCounts.empty,
				})),
			);

			expect(tree).toHaveLength(2); // Root node + orphaned node
			expect(tree[0].id).toBe("d1");
			expect(tree[0].children).toHaveLength(1);
			expect(tree[0].children[0].id).toBe("d3");
			expect(tree[1].id).toBe("d2"); // Orphaned node becomes root
		});

		it("should sort children by drawing number", () => {
			const unsortedDrawings = [
				{ id: "1", number: "DWG-003", title: "C", parentId: null },
				{ id: "2", number: "DWG-001", title: "A", parentId: null },
				{ id: "3", number: "DWG-002", title: "B", parentId: null },
			].map((d) => ({
				...d,
				projectId: "p1",
				createdAt: new Date(),
				updatedAt: new Date(),
				componentCount: mockComponentCounts.empty,
			}));

			const tree = buildDrawingTree(unsortedDrawings);

			expect(tree[0].number).toBe("DWG-001");
			expect(tree[1].number).toBe("DWG-002");
			expect(tree[2].number).toBe("DWG-003");
		});

		it("should preserve component counts", () => {
			const drawingsWithCounts = mockFlatDrawings.map((d, i) => ({
				...d,
				componentCount:
					Object.values(mockComponentCounts)[i] ||
					mockComponentCounts.empty,
			}));

			const tree = buildDrawingTree(drawingsWithCounts);

			expect(tree[0].componentCount).toBeDefined();
			expect(tree[0].componentCount.total).toBeGreaterThanOrEqual(0);
		});
	});

	describe("flattenDrawingTree", () => {
		it("should flatten a tree structure", () => {
			const flat = flattenDrawingTree(mockSimpleTree);

			expect(flat).toHaveLength(4); // All nodes flattened
			expect(flat[0].level).toBe(0); // Root level
			expect(flat[1].level).toBe(1); // Child level
			expect(flat[2].level).toBe(1); // Child level
			expect(flat[3].level).toBe(0); // Second root
		});

		it("should handle deep nesting", () => {
			const flat = flattenDrawingTree(mockDeepTree);

			expect(flat).toHaveLength(5);
			expect(flat[0].level).toBe(0); // Root
			expect(flat[1].level).toBe(1); // Level 1
			expect(flat[2].level).toBe(2); // Level 2
			expect(flat[3].level).toBe(3); // Level 3
			expect(flat[4].level).toBe(4); // Level 4
		});

		it("should handle empty tree", () => {
			const flat = flattenDrawingTree([]);
			expect(flat).toEqual([]);
		});
	});

	describe("findDrawingInTree", () => {
		it("should find a drawing at root level", () => {
			const drawing = findDrawingInTree(mockSimpleTree, "d1");
			expect(drawing).toBeDefined();
			expect(drawing?.id).toBe("d1");
			expect(drawing?.number).toBe("P&ID-001");
		});

		it("should find a drawing in nested level", () => {
			const drawing = findDrawingInTree(mockSimpleTree, "d3");
			expect(drawing).toBeDefined();
			expect(drawing?.id).toBe("d3");
			expect(drawing?.number).toBe("P&ID-001-B");
		});

		it("should find a deeply nested drawing", () => {
			const drawing = findDrawingInTree(mockDeepTree, "d5");
			expect(drawing).toBeDefined();
			expect(drawing?.id).toBe("d5");
		});

		it("should return null for non-existent drawing", () => {
			const drawing = findDrawingInTree(mockSimpleTree, "non-existent");
			expect(drawing).toBeNull();
		});

		it("should handle empty tree", () => {
			const drawing = findDrawingInTree([], "any-id");
			expect(drawing).toBeNull();
		});
	});

	describe("getDrawingPath", () => {
		it("should get path to root drawing", () => {
			const path = getDrawingPath(mockSimpleTree, "d1");
			expect(path).toHaveLength(1);
			expect(path[0].id).toBe("d1");
		});

		it("should get path to nested drawing", () => {
			const path = getDrawingPath(mockSimpleTree, "d3");
			expect(path).toHaveLength(2);
			expect(path[0].id).toBe("d1"); // Parent
			expect(path[1].id).toBe("d3"); // Target
		});

		it("should get path to deeply nested drawing", () => {
			const path = getDrawingPath(mockDeepTree, "d5");
			expect(path).toHaveLength(5);
			expect(path.map((d) => d.id)).toEqual([
				"d1",
				"d2",
				"d3",
				"d4",
				"d5",
			]);
		});

		it("should return empty array for non-existent drawing", () => {
			const path = getDrawingPath(mockSimpleTree, "non-existent");
			expect(path).toEqual([]);
		});
	});

	describe("getExpandedNodeIds", () => {
		it("should get parent IDs to expand for target", () => {
			const expanded = getExpandedNodeIds(mockSimpleTree, "d3");
			expect(expanded).toEqual(["d1"]); // Only parent, not target itself
		});

		it("should get all ancestor IDs for deeply nested target", () => {
			const expanded = getExpandedNodeIds(mockDeepTree, "d5");
			expect(expanded).toEqual(["d1", "d2", "d3", "d4"]);
		});

		it("should return empty array for root drawing", () => {
			const expanded = getExpandedNodeIds(mockSimpleTree, "d1");
			expect(expanded).toEqual([]);
		});

		it("should return empty array for non-existent drawing", () => {
			const expanded = getExpandedNodeIds(mockSimpleTree, "non-existent");
			expect(expanded).toEqual([]);
		});
	});

	describe("getAllDrawingIds", () => {
		it("should collect all drawing IDs", () => {
			const ids = getAllDrawingIds(mockSimpleTree);
			expect(ids).toHaveLength(4);
			expect(ids).toContain("d1");
			expect(ids).toContain("d2");
			expect(ids).toContain("d3");
			expect(ids).toContain("d4");
		});

		it("should handle deep trees", () => {
			const ids = getAllDrawingIds(mockDeepTree);
			expect(ids).toHaveLength(5);
			expect(ids).toEqual(["d1", "d2", "d3", "d4", "d5"]);
		});

		it("should handle empty tree", () => {
			const ids = getAllDrawingIds([]);
			expect(ids).toEqual([]);
		});
	});

	describe("filterDrawingTree", () => {
		it("should filter by drawing number", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "001-A");
			expect(filtered).toHaveLength(1); // Only parent with matching child
			expect(filtered[0].children).toHaveLength(1); // Only matching child
			expect(filtered[0].children[0].number).toBe("P&ID-001-A");
		});

		it("should filter by drawing title", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "Secondary");
			expect(filtered).toHaveLength(1);
			expect(filtered[0].title).toBe("Secondary Process");
		});

		it("should preserve parent when child matches", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "Detail B");
			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe("d1"); // Parent preserved
			expect(filtered[0].children).toHaveLength(1);
			expect(filtered[0].children[0].title).toBe("Process Flow Detail B");
		});

		it("should be case insensitive", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "SECONDARY");
			expect(filtered).toHaveLength(1);
			expect(filtered[0].title).toBe("Secondary Process");
		});

		it("should return all drawings when query is empty", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "");
			expect(filtered).toEqual(mockSimpleTree);
		});

		it("should return empty array when no matches", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "xyz123");
			expect(filtered).toEqual([]);
		});

		it("should filter by revision", () => {
			const filtered = filterDrawingTree(mockSimpleTree, "B");
			// Should match both P&ID-001-B (in number) and P&ID-002 (revision B)
			// Plus P&ID-001 is included as parent of P&ID-001-B
			expect(filtered).toHaveLength(2);
			// First tree has P&ID-001 with child P&ID-001-B
			expect(filtered[0].number).toBe("P&ID-001");
			expect(filtered[0].children).toHaveLength(1);
			expect(filtered[0].children[0].number).toBe("P&ID-001-B");
			// Second tree has P&ID-002 with revision B
			expect(filtered[1].number).toBe("P&ID-002");
			expect(filtered[1].revision).toBe("B");
		});
	});

	describe("countDrawingsInTree", () => {
		it("should count all drawings in tree", () => {
			const count = countDrawingsInTree(mockSimpleTree);
			expect(count).toBe(4);
		});

		it("should count deeply nested drawings", () => {
			const count = countDrawingsInTree(mockDeepTree);
			expect(count).toBe(5);
		});

		it("should handle empty tree", () => {
			const count = countDrawingsInTree([]);
			expect(count).toBe(0);
		});

		it("should count large trees", () => {
			const largeTree = Array.from({ length: 10 }, (_, i) => ({
				...mockSimpleTree[0],
				id: `root-${i}`,
				children: Array.from({ length: 10 }, (_, j) => ({
					...mockSimpleTree[0].children[0],
					id: `child-${i}-${j}`,
					children: [],
				})),
			}));
			const count = countDrawingsInTree(largeTree);
			expect(count).toBe(110); // 10 roots + 100 children
		});
	});

	describe("getTreeDepth", () => {
		it("should get depth of simple tree", () => {
			const depth = getTreeDepth(mockSimpleTree);
			expect(depth).toBe(2); // Root + 1 level of children
		});

		it("should get depth of deep tree", () => {
			const depth = getTreeDepth(mockDeepTree);
			expect(depth).toBe(5); // 5 levels deep
		});

		it("should return 0 for empty tree", () => {
			const depth = getTreeDepth([]);
			expect(depth).toBe(0);
		});

		it("should return 1 for flat tree (no children)", () => {
			const flatTree = [
				{ ...mockSimpleTree[0], children: [] },
				{ ...mockSimpleTree[1], children: [] },
			];
			const depth = getTreeDepth(flatTree);
			expect(depth).toBe(1);
		});
	});

	describe("updateDrawingComponentCount", () => {
		it("should update component count for specific drawing", () => {
			const newCount = mockComponentCounts.allComplete;
			const updated = updateDrawingComponentCount(
				mockSimpleTree,
				"d2",
				newCount,
			);

			const updatedDrawing = findDrawingInTree(updated, "d2");
			expect(updatedDrawing?.componentCount).toEqual(newCount);
		});

		it("should update deeply nested drawing", () => {
			const newCount = mockComponentCounts.inProgress;
			const updated = updateDrawingComponentCount(
				mockDeepTree,
				"d5",
				newCount,
			);

			const updatedDrawing = findDrawingInTree(updated, "d5");
			expect(updatedDrawing?.componentCount).toEqual(newCount);
		});

		it("should not modify other drawings", () => {
			const newCount = mockComponentCounts.allComplete;
			const original = JSON.stringify(mockSimpleTree[1]);
			const updated = updateDrawingComponentCount(
				mockSimpleTree,
				"d2",
				newCount,
			);

			expect(JSON.stringify(updated[1])).toBe(original);
		});

		it("should handle non-existent drawing ID", () => {
			const newCount = mockComponentCounts.allComplete;
			const updated = updateDrawingComponentCount(
				mockSimpleTree,
				"non-existent",
				newCount,
			);

			expect(updated).toEqual(mockSimpleTree);
		});

		it("should create new tree instances (immutability)", () => {
			const newCount = mockComponentCounts.allComplete;
			const updated = updateDrawingComponentCount(
				mockSimpleTree,
				"d2",
				newCount,
			);

			expect(updated).not.toBe(mockSimpleTree);
			expect(updated[0]).not.toBe(mockSimpleTree[0]);
			expect(updated[0].children).not.toBe(mockSimpleTree[0].children);
		});
	});
});
