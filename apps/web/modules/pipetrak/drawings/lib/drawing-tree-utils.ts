import type {
	DrawingTreeNode,
	Drawing,
	DrawingComponentCount,
} from "../../types";

/**
 * Flattens a tree structure into a flat array
 */
export function flattenDrawingTree(
	drawings: DrawingTreeNode[],
): DrawingTreeNode[] {
	const result: DrawingTreeNode[] = [];

	const traverse = (nodes: DrawingTreeNode[], level = 0) => {
		nodes.forEach((node) => {
			result.push({ ...node, level });
			if (node.children && node.children.length > 0) {
				traverse(node.children, level + 1);
			}
		});
	};

	traverse(drawings);
	return result;
}

/**
 * Builds a tree structure from a flat array of drawings
 */
export function buildDrawingTree(
	drawings: (Drawing & { componentCount?: DrawingComponentCount })[],
): DrawingTreeNode[] {
	const drawingMap = new Map<string, DrawingTreeNode>();
	const rootDrawings: DrawingTreeNode[] = [];

	// First pass: create all nodes
	drawings.forEach((drawing) => {
		drawingMap.set(drawing.id, {
			...drawing,
			children: [],
			componentCount: drawing.componentCount || {
				total: 0,
				notStarted: 0,
				inProgress: 0,
				completed: 0,
				onHold: 0,
			},
		});
	});

	// Second pass: build relationships
	drawings.forEach((drawing) => {
		const node = drawingMap.get(drawing.id)!;

		if (drawing.parentId) {
			const parent = drawingMap.get(drawing.parentId);
			if (parent) {
				parent.children.push(node);
			} else {
				// Parent not found, treat as root
				rootDrawings.push(node);
			}
		} else {
			// No parent, it's a root node
			rootDrawings.push(node);
		}
	});

	// Sort children at each level
	const sortChildren = (nodes: DrawingTreeNode[]) => {
		nodes.sort((a, b) => a.number.localeCompare(b.number));
		nodes.forEach((node) => {
			if (node.children.length > 0) {
				sortChildren(node.children);
			}
		});
	};

	sortChildren(rootDrawings);

	return rootDrawings;
}

/**
 * Finds a drawing by ID in the tree structure
 */
export function findDrawingInTree(
	drawings: DrawingTreeNode[],
	drawingId: string,
): DrawingTreeNode | null {
	for (const drawing of drawings) {
		if (drawing.id === drawingId) {
			return drawing;
		}
		if (drawing.children && drawing.children.length > 0) {
			const found = findDrawingInTree(drawing.children, drawingId);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Gets the path from root to a specific drawing
 */
export function getDrawingPath(
	drawings: DrawingTreeNode[],
	drawingId: string,
): DrawingTreeNode[] {
	const path: DrawingTreeNode[] = [];

	const findPath = (nodes: DrawingTreeNode[], targetId: string): boolean => {
		for (const node of nodes) {
			path.push(node);

			if (node.id === targetId) {
				return true;
			}

			if (node.children && node.children.length > 0) {
				if (findPath(node.children, targetId)) {
					return true;
				}
			}

			path.pop();
		}

		return false;
	};

	findPath(drawings, drawingId);
	return path;
}

/**
 * Gets all drawing IDs that should be expanded to show a specific drawing
 */
export function getExpandedNodeIds(
	drawings: DrawingTreeNode[],
	targetDrawingId: string,
): string[] {
	const path = getDrawingPath(drawings, targetDrawingId);
	// Exclude the target drawing itself from the expanded list
	return path.slice(0, -1).map((d) => d.id);
}

/**
 * Collects all drawing IDs in the tree
 */
export function getAllDrawingIds(drawings: DrawingTreeNode[]): string[] {
	const ids: string[] = [];

	const collect = (nodes: DrawingTreeNode[]) => {
		nodes.forEach((node) => {
			ids.push(node.id);
			if (node.children && node.children.length > 0) {
				collect(node.children);
			}
		});
	};

	collect(drawings);
	return ids;
}

/**
 * FileFilters drawings based on a search query
 */
export function filterDrawingTree(
	drawings: DrawingTreeNode[],
	query: string,
): DrawingTreeNode[] {
	if (!query) return drawings;

	const lowerQuery = query.toLowerCase();

	const filterNodes = (nodes: DrawingTreeNode[]): DrawingTreeNode[] => {
		return nodes
			.map((node) => {
				const matchesSearch =
					node.number.toLowerCase().includes(lowerQuery) ||
					node.title.toLowerCase().includes(lowerQuery) ||
					(node.revision &&
						node.revision.toLowerCase().includes(lowerQuery));

				const filteredChildren = node.children
					? filterNodes(node.children)
					: [];

				if (matchesSearch || filteredChildren.length > 0) {
					return {
						...node,
						children: filteredChildren,
					};
				}

				return null;
			})
			.filter((node): node is DrawingTreeNode => node !== null);
	};

	return filterNodes(drawings);
}

/**
 * Counts total drawings in the tree
 */
export function countDrawingsInTree(drawings: DrawingTreeNode[]): number {
	let count = 0;

	const traverse = (nodes: DrawingTreeNode[]) => {
		nodes.forEach((node) => {
			count++;
			if (node.children && node.children.length > 0) {
				traverse(node.children);
			}
		});
	};

	traverse(drawings);
	return count;
}

/**
 * Gets the maximum depth of the tree
 */
export function getTreeDepth(drawings: DrawingTreeNode[]): number {
	if (drawings.length === 0) return 0;

	const getDepth = (nodes: DrawingTreeNode[], currentDepth = 1): number => {
		let maxDepth = currentDepth;

		nodes.forEach((node) => {
			if (node.children && node.children.length > 0) {
				const childDepth = getDepth(node.children, currentDepth + 1);
				maxDepth = Math.max(maxDepth, childDepth);
			}
		});

		return maxDepth;
	};

	return getDepth(drawings);
}

/**
 * Updates component count for a specific drawing in the tree
 */
export function updateDrawingComponentCount(
	drawings: DrawingTreeNode[],
	drawingId: string,
	componentCount: DrawingComponentCount,
): DrawingTreeNode[] {
	return drawings.map((drawing) => {
		if (drawing.id === drawingId) {
			return {
				...drawing,
				componentCount,
			};
		}

		if (drawing.children && drawing.children.length > 0) {
			return {
				...drawing,
				children: updateDrawingComponentCount(
					drawing.children,
					drawingId,
					componentCount,
				),
			};
		}

		return drawing;
	});
}
