#!/usr/bin/env tsx

// Quick test script to verify the import system
import { ComponentTypeMapper } from "./packages/api/src/lib/import/type-mapper";
import { parseExcel, calculateTotalInstances } from "./packages/api/src/lib/import/excel-parser";
import * as fs from "fs";

async function testImportSystem() {
  console.log("🧪 Testing Import System V2\n");

  // Test 1: Type Mapper
  console.log("=== Testing Type Mapper ===");
  const typeMapper = new ComponentTypeMapper();
  
  const testTypes = [
    "Support", "Valve", "Gasket", "Flange", "Fitting", 
    "Instrument", "Gate Valve", "Check Vlv", "Unknown Type"
  ];
  
  for (const type of testTypes) {
    const mapped = typeMapper.mapType(type);
    console.log(`"${type}" → ${mapped}`);
  }
  
  // Test 2: Excel Parser (if TAKEOFF file exists)
  console.log("\n=== Testing Excel Parser ===");
  const filePath = "../../project-documentation/TAKEOFF - 5932.xlsx";
  
  if (fs.existsSync(filePath)) {
    console.log("📊 Found TAKEOFF file, parsing...");
    
    try {
      const buffer = fs.readFileSync(filePath);
      const parsed = await parseExcel(buffer);
      
      console.log(`📋 Parsed ${parsed.rows.length} rows`);
      console.log(`📊 Headers: ${parsed.headers.join(', ')}`);
      
      // Extract types and get mapping stats
      const typeColumn = 'TYPE';
      const types = parsed.rows
        .map(row => row[typeColumn])
        .filter(type => type && type.trim() !== '');
      
      console.log(`\n🔍 Found ${types.length} component types`);
      
      const typeCounts = typeMapper.getTypeCounts(types);
      console.log("📈 Type mapping results:");
      console.log(`  Valves: ${typeCounts.valve}`);
      console.log(`  Supports: ${typeCounts.support}`);
      console.log(`  Gaskets: ${typeCounts.gasket}`);
      console.log(`  Flanges: ${typeCounts.flange}`);
      console.log(`  Fittings: ${typeCounts.fitting}`);
      console.log(`  Instruments: ${typeCounts.instrument}`);
      console.log(`  Pipes: ${typeCounts.pipe}`);
      console.log(`  Spools: ${typeCounts.spool}`);
      console.log(`  Field Welds: ${typeCounts.fieldWeld}`);
      console.log(`  Unknown/MISC: ${typeCounts.misc}`);
      
      const totalInstances = calculateTotalInstances(parsed.rows);
      console.log(`\n📊 Total instances after quantity expansion: ${totalInstances}`);
      
      // Show a few sample rows
      console.log("\n📋 Sample rows:");
      for (let i = 0; i < Math.min(5, parsed.rows.length); i++) {
        const row = parsed.rows[i];
        console.log(`  Row ${i+1}: ${row['DRAWING']} | ${row['CMDTY CODE']} | ${row['TYPE']} | Qty: ${row['QTY']}`);
      }
      
    } catch (error) {
      console.error("❌ Error parsing Excel file:", error.message);
    }
  } else {
    console.log("⚠️ TAKEOFF file not found, skipping Excel test");
  }
  
  console.log("\n✅ Import system test completed!");
}

// Run the test
testImportSystem().catch(console.error);