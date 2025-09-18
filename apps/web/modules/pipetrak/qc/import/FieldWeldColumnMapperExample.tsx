"use client";

import { Button } from "@ui/components/button";
import { useState } from "react";
import { FieldWeldColumnMapper } from "./FieldWeldColumnMapper";

/**
 * Example component demonstrating how to use FieldWeldColumnMapper
 * This shows the integration pattern with parsed WELD LOG data
 */
export function FieldWeldColumnMapperExample() {
	const [currentStep, setCurrentStep] = useState<
		"upload" | "mapping" | "validation"
	>("mapping");
	const [mappings, setMappings] = useState<Record<string, string>>({});

	// Mock parsed data from WELD LOG.xlsx (27 columns A-AA)
	const mockParsedData = {
		headers: [
			"Weld ID Number", // A
			"Welder Stencil", // B
			"Column C", // C - empty
			"Drawing / Isometric Number", // D
			"Column E", // E - empty
			"Package Number", // F
			"Test Pressure", // G
			"Column H", // H - empty
			"Weld Size", // I
			"SPEC", // J
			"Column K", // K - empty
			"Column L", // L - empty
			"Column M", // M - empty
			"Column N", // N - empty
			"Column O", // O - empty
			"Column P", // P - empty
			"Column Q", // Q - empty
			"PMI Required", // R
			"PWHT Required", // S
			"X-ray Percentage", // T
			"Weld Type", // U
			"Column V", // V - empty
			"Column W", // W - empty
			"Column X", // X - empty
			"PMI Complete Date", // Y
			"Column Z", // Z - empty
			"Comments", // AA
		],
		rows: [
			{
				"Weld ID Number": "1",
				"Welder Stencil": "ABC123",
				"Drawing / Isometric Number": "P-26B07 01of01",
				"Package Number": "PKG-001",
				"Test Pressure": "150",
				"Weld Size": '3"',
				SPEC: "HC05",
				"PMI Required": "X",
				"PWHT Required": "Yes",
				"X-ray Percentage": "10%",
				"Weld Type": "BW",
				"PMI Complete Date": "2024-12-15",
				Comments: "Standard weld",
			},
			{
				"Weld ID Number": "2",
				"Welder Stencil": "DEF456",
				"Drawing / Isometric Number": "P-26B07 01of01",
				"Package Number": "PKG-001",
				"Test Pressure": "150",
				"Weld Size": '2"',
				SPEC: "HC05",
				"PMI Required": "",
				"PWHT Required": "No",
				"X-ray Percentage": "5%",
				"Weld Type": "SW",
				"PMI Complete Date": "",
				Comments: "Socket weld connection",
			},
			{
				"Weld ID Number": "3",
				"Welder Stencil": "GHI789",
				"Drawing / Isometric Number": "P-26B08 01of01",
				"Package Number": "PKG-002",
				"Test Pressure": "300",
				"Weld Size": '4"',
				SPEC: "HC10",
				"PMI Required": "Yes",
				"PWHT Required": "X",
				"X-ray Percentage": "100%",
				"Weld Type": "BW",
				"PMI Complete Date": "2024-12-10",
				Comments: "Critical weld - high pressure",
			},
		],
		metadata: {
			filename: "WELD LOG.xlsx",
			totalRows: 3,
			totalColumns: 27,
		},
	};

	// Mock validation results
	const mockValidationResults = {
		isValid: true,
		errors: [],
		warnings: [
			"Some optional fields are not mapped but can be updated later",
		],
	};

	const handleMappingChange = (newMappings: Record<string, string>) => {
		setMappings(newMappings);
		console.log("Column mappings updated:", newMappings);
	};

	const handleContinue = () => {
		console.log("Proceeding with mappings:", mappings);
		setCurrentStep("validation");
	};

	const handleBack = () => {
		console.log("Going back to upload step");
		setCurrentStep("upload");
	};

	if (currentStep === "upload") {
		return (
			<div className="p-8 text-center">
				<p>Upload step (not implemented in this example)</p>
				<Button onClick={() => setCurrentStep("mapping")}>
					Go to Mapping Example
				</Button>
			</div>
		);
	}

	if (currentStep === "validation") {
		return (
			<div className="p-8 text-center space-y-4">
				<h2 className="text-xl font-semibold">Validation Step</h2>
				<p>Column mapping complete! Mappings:</p>
				<pre className="bg-muted p-4 rounded text-left text-sm">
					{JSON.stringify(mappings, null, 2)}
				</pre>
				<Button onClick={() => setCurrentStep("mapping")}>
					Back to Mapping
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">
					Field Weld Column Mapper Example
				</h1>
				<p className="text-muted-foreground">
					This demonstrates the WELD LOG.xlsx column mapping interface
				</p>
			</div>

			<FieldWeldColumnMapper
				parsedData={mockParsedData}
				mappings={mappings}
				onMappingChange={handleMappingChange}
				onContinue={handleContinue}
				onBack={handleBack}
				validationResults={mockValidationResults}
			/>
		</div>
	);
}
