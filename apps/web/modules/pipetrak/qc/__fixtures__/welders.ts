import type { Welder } from "../hooks/useWelders";

export const mockWelders: Welder[] = [
	{
		id: "welder-001",
		projectId: "test-project-id",
		stencil: "JD-001",
		name: "John Doe",
		active: true,
		weldCount: 15,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "welder-002",
		projectId: "test-project-id",
		stencil: "SM002",
		name: "Sarah Miller",
		active: true,
		weldCount: 23,
		createdAt: "2024-01-16T08:30:00Z",
		updatedAt: "2024-01-16T08:30:00Z",
	},
	{
		id: "welder-003",
		projectId: "test-project-id",
		stencil: "BW-003",
		name: "Bob Wilson",
		active: false,
		weldCount: 8,
		createdAt: "2024-01-17T14:15:00Z",
		updatedAt: "2024-01-20T09:00:00Z",
	},
	{
		id: "welder-004",
		projectId: "test-project-id",
		stencil: "MJ004",
		name: "Mike Johnson",
		active: true,
		weldCount: 0,
		createdAt: "2024-01-21T11:45:00Z",
		updatedAt: "2024-01-21T11:45:00Z",
	},
	{
		id: "welder-005",
		projectId: "test-project-id",
		stencil: "K-07",
		name: "Lisa Thompson",
		active: false,
		weldCount: 31,
		createdAt: "2024-01-10T16:20:00Z",
		updatedAt: "2024-01-22T13:30:00Z",
	},
];

export const generateMockWelders = (
	count: number,
	projectId = "test-project-id",
): Welder[] => {
	const firstNames = [
		"John",
		"Sarah",
		"Bob",
		"Mike",
		"Lisa",
		"Dave",
		"Anna",
		"Chris",
		"Emma",
		"Ryan",
	];
	const lastNames = [
		"Smith",
		"Johnson",
		"Williams",
		"Brown",
		"Jones",
		"Garcia",
		"Miller",
		"Davis",
		"Rodriguez",
		"Martinez",
	];

	return Array.from({ length: count }, (_, i) => {
		const firstName = firstNames[i % firstNames.length];
		const lastName =
			lastNames[Math.floor(i / firstNames.length) % lastNames.length];
		const initials = firstName[0] + lastName[0];
		const number = String(i + 1).padStart(3, "0");
		// Mix of hyphenated and non-hyphenated stencils for variety
		const useHyphen = i % 3 === 0;

		return {
			id: `welder-${String(i + 1).padStart(3, "0")}`,
			projectId,
			stencil: useHyphen
				? `${initials}-${number}`
				: `${initials}${number}`,
			name: `${firstName} ${lastName}`,
			active: Math.random() > 0.3, // 70% active
			weldCount: Math.floor(Math.random() * 50),
			createdAt: new Date(
				Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
			).toISOString(),
			updatedAt: new Date(
				Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
			).toISOString(),
		};
	});
};

// Test scenarios
export const testScenarios = {
	// Welders for different test cases
	activeWelders: mockWelders.filter((w) => w.active),
	inactiveWelders: mockWelders.filter((w) => !w.active),
	weldersWithNoWelds: mockWelders.filter((w) => w.weldCount === 0),
	weldersWithWelds: mockWelders.filter((w) => w.weldCount > 0),

	// Search test data
	searchableWelders: [
		...mockWelders,
		{
			id: "welder-search-1",
			projectId: "test-project-id",
			stencil: "TEST-1",
			name: "Test Welder One",
			active: true,
			weldCount: 5,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: "welder-search-2",
			projectId: "test-project-id",
			stencil: "ABC123",
			name: "Another Test Welder",
			active: true,
			weldCount: 10,
			createdAt: "2024-01-02T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		},
	] as Welder[],
};

// Edge case test data
export const edgeCaseWelders = {
	// Valid stencil formats with hyphens
	validStencilsWithHyphens: [
		"K-07", // letters + hyphen + numbers
		"W-123", // letter + hyphen + numbers
		"JD-456", // letters + hyphen + numbers
		"ABC-001", // letters + hyphen + numbers
		"X-1", // single letter + hyphen + number
	],

	// Valid stencil formats without hyphens
	validStencilsWithoutHyphens: [
		"K07", // letters + numbers
		"W123", // letter + numbers
		"JD456", // letters + numbers
		"ABC001", // letters + numbers
		"X1", // single letter + number
		"123", // Numbers only (valid but edge case)
		"A", // Single character (valid but edge case)
	],

	// Invalid stencil formats
	invalidStencils: [
		"K_07", // Contains underscore
		"K.07", // Contains period
		"K 07", // Contains space
		"K-07!", // Contains special character after hyphen
		"TEST@1", // Contains special character
		"--123", // Multiple hyphens
		"ABC-", // Ends with hyphen
		"-123", // Starts with hyphen
		"", // Empty (invalid)
		"   ", // Whitespace only (invalid)
	],

	// Name validation edge cases
	invalidNames: [
		"A", // Too short
		"", // Empty
		"   ", // Whitespace only
	],

	validEdgeCases: {
		minimalStencil: "A",
		minimalName: "Jo",
		maxLengthStencil: "A".repeat(50), // Assuming reasonable max length
		maxLengthName: "Very Long Welder Name That Tests Maximum Length Limits",
	},
};

// Field weld test data
export const mockFieldWelds = [
	{
		id: "weld-001",
		weldIdNumber: "W-001",
		welderId: "welder-001",
		projectId: "test-project-id",
		drawingId: "DWG-001",
		weldSize: '6"',
		schedule: "40",
		weldTypeCode: "BW",
		dateWelded: "2024-01-15T10:00:00Z",
		baseMetal: "A106 Gr B",
		pwhtRequired: false,
		comments: "Standard butt weld",
	},
	{
		id: "weld-002",
		weldIdNumber: "W-002",
		welderId: "welder-002",
		projectId: "test-project-id",
		drawingId: "DWG-002",
		weldSize: '4"',
		schedule: "80",
		weldTypeCode: "SW",
		dateWelded: "2024-01-16T14:30:00Z",
		baseMetal: "304L",
		pwhtRequired: true,
		comments: "Socket weld with PWHT",
	},
];

// Performance test data
export const performanceTestData = {
	largeWelderSet: generateMockWelders(1000),
	xlWelderSet: generateMockWelders(10000),
};
