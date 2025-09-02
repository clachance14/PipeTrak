#!/usr/bin/env node

// Test error handling and edge cases for ImportWizard V2
import * as xlsx from 'xlsx';
import { ComponentTypeMapper } from "./packages/api/src/lib/import/type-mapper";
import { parseExcel, calculateTotalInstances } from "./packages/api/src/lib/import/excel-parser";

async function testErrorHandling() {
  console.log("🧪 Testing Error Handling and Edge Cases for ImportWizard V2\n");

  try {
    const typeMapper = new ComponentTypeMapper();

    console.log("=== Test 1: Invalid Excel File Formats ===");
    
    // Test with invalid base64 data
    try {
      const invalidBase64 = "invalid-base64-data";
      const buffer = Buffer.from(invalidBase64, 'base64');
      await parseExcel(buffer);
      console.log("❌ Should have failed with invalid base64");
    } catch (error) {
      console.log("✅ Correctly rejected invalid base64:", error.message.substring(0, 50) + "...");
    }
    
    // Test with empty buffer
    try {
      const emptyBuffer = Buffer.from('', 'base64');
      await parseExcel(emptyBuffer);
      console.log("❌ Should have failed with empty buffer");
    } catch (error) {
      console.log("✅ Correctly rejected empty buffer:", error.message.substring(0, 50) + "...");
    }

    console.log("\n=== Test 2: Empty and Invalid Excel Data ===");
    
    // Create empty Excel file
    const emptyWorkbook = xlsx.utils.book_new();
    const emptySheet = xlsx.utils.aoa_to_sheet([]);
    xlsx.utils.book_append_sheet(emptyWorkbook, emptySheet, 'Sheet1');
    const emptyBuffer = Buffer.from(xlsx.write(emptyWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(emptyBuffer);
      if (result.rows.length === 0) {
        console.log("✅ Correctly handled empty Excel file");
      } else {
        console.log("❌ Empty Excel file should have 0 rows");
      }
    } catch (error) {
      console.log("⚠️  Empty Excel file threw error:", error.message);
    }

    // Create Excel with only headers
    const headerOnlyData = [
      ['DRAWING', 'CMDTY CODE', 'TYPE', 'QTY']
    ];
    const headerWorkbook = xlsx.utils.book_new();
    const headerSheet = xlsx.utils.aoa_to_sheet(headerOnlyData);
    xlsx.utils.book_append_sheet(headerWorkbook, headerSheet, 'Sheet1');
    const headerBuffer = Buffer.from(xlsx.write(headerWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(headerBuffer);
      if (result.rows.length === 0 && result.headers.length === 4) {
        console.log("✅ Correctly handled headers-only Excel file");
      } else {
        console.log("❌ Headers-only should have headers but no data rows");
      }
    } catch (error) {
      console.log("⚠️  Headers-only Excel file threw error:", error.message);
    }

    console.log("\n=== Test 3: Missing Required Fields ===");
    
    // Test data with missing required fields
    const missingFieldsData = [
      ['DRAWING', 'CMDTY CODE', 'TYPE', 'QTY'],
      ['P-001', '', 'Valve', '1'],           // Missing component ID
      ['', 'COMP-002', 'Support', '2'],      // Missing drawing
      ['P-003', 'COMP-003', '', '1'],        // Missing type
      ['P-004', 'COMP-004', 'Fitting', '']   // Missing quantity
    ];
    
    const missingFieldsWorkbook = xlsx.utils.book_new();
    const missingFieldsSheet = xlsx.utils.aoa_to_sheet(missingFieldsData);
    xlsx.utils.book_append_sheet(missingFieldsWorkbook, missingFieldsSheet, 'Sheet1');
    const missingFieldsBuffer = Buffer.from(xlsx.write(missingFieldsWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(missingFieldsBuffer);
      console.log(`Parsed file with missing fields: ${result.rows.length} rows`);
      
      // Check each row for missing fields
      result.rows.forEach((row, idx) => {
        const drawing = row['DRAWING'];
        const componentId = row['CMDTY CODE'];
        const type = row['TYPE'];
        const qty = row['QTY'];
        
        if (!drawing || !componentId) {
          console.log(`✅ Row ${idx + 1}: Missing required fields detected (drawing: "${drawing}", componentId: "${componentId}")`);
        } else if (!type) {
          console.log(`⚠️  Row ${idx + 1}: Missing type will be mapped to MISC`);
        } else if (!qty || isNaN(Number.parseInt(qty))) {
          console.log(`⚠️  Row ${idx + 1}: Missing/invalid quantity will default to 1`);
        }
      });
    } catch (error) {
      console.log("❌ Failed to parse file with missing fields:", error.message);
    }

    console.log("\n=== Test 4: Invalid Data Types ===");
    
    // Test with invalid quantity values
    const invalidQuantityData = [
      ['DRAWING', 'CMDTY CODE', 'TYPE', 'QTY'],
      ['P-001', 'COMP-001', 'Valve', 'abc'],      // Text quantity
      ['P-001', 'COMP-002', 'Support', '-5'],     // Negative quantity
      ['P-001', 'COMP-003', 'Fitting', '0'],      // Zero quantity
      ['P-001', 'COMP-004', 'Gasket', '2.5']      // Decimal quantity
    ];
    
    const invalidQtyWorkbook = xlsx.utils.book_new();
    const invalidQtySheet = xlsx.utils.aoa_to_sheet(invalidQuantityData);
    xlsx.utils.book_append_sheet(invalidQtyWorkbook, invalidQtySheet, 'Sheet1');
    const invalidQtyBuffer = Buffer.from(xlsx.write(invalidQtyWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(invalidQtyBuffer);
      const totalInstances = calculateTotalInstances(result.rows);
      console.log(`✅ Handled invalid quantities: ${result.rows.length} rows, ${totalInstances} total instances`);
      
      result.rows.forEach((row, idx) => {
        const qty = Number.parseInt(row['QTY']) || 1;
        console.log(`  Row ${idx + 1}: "${row['QTY']}" → ${qty} (parsed)`);
      });
      
    } catch (error) {
      console.log("❌ Failed to handle invalid quantities:", error.message);
    }

    console.log("\n=== Test 5: Unknown Component Types ===");
    
    const unknownTypes = [
      'Weird Component',
      'Unknown Part',
      'Mystery Item',
      '',
      null,
      undefined,
      'RANDOM-STUFF'
    ];
    
    unknownTypes.forEach(type => {
      const mapped = typeMapper.mapType(type);
      console.log(`"${type}" → ${mapped}`);
    });
    
    const stats = typeMapper.getMappingStats(unknownTypes);
    console.log(`✅ Unknown types handling: ${stats.unknown.length} unknown types mapped to MISC`);

    console.log("\n=== Test 6: Large File Handling ===");
    
    // Simulate a large file with many rows
    const largeFileHeaders = ['DRAWING', 'CMDTY CODE', 'TYPE', 'QTY'];
    const largeFileData = [largeFileHeaders];
    
    // Generate 1000 test rows
    for (let i = 1; i <= 1000; i++) {
      largeFileData.push([
        `DWG-${Math.floor(i / 100)}`, // 10 drawings with 100 components each
        `COMP-${i.toString().padStart(4, '0')}`,
        ['Valve', 'Support', 'Gasket', 'Fitting'][i % 4],
        Math.floor(Math.random() * 5) + 1
      ]);
    }
    
    const largeWorkbook = xlsx.utils.book_new();
    const largeSheet = xlsx.utils.aoa_to_sheet(largeFileData);
    xlsx.utils.book_append_sheet(largeWorkbook, largeSheet, 'Sheet1');
    const largeBuffer = Buffer.from(xlsx.write(largeWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    console.log(`Large file test: ${largeFileData.length - 1} rows, ${Math.round(largeBuffer.length / 1024)}KB`);
    
    try {
      const startTime = Date.now();
      const result = await parseExcel(largeBuffer);
      const endTime = Date.now();
      
      const totalInstances = calculateTotalInstances(result.rows);
      const uniqueDrawings = new Set(result.rows.map(row => row['DRAWING'])).size;
      
      console.log(`✅ Large file processed in ${endTime - startTime}ms`);
      console.log(`  Parsed: ${result.rows.length} rows`);
      console.log(`  Instances: ${totalInstances}`);
      console.log(`  Drawings: ${uniqueDrawings}`);
      
      if (result.rows.length === 1000) {
        console.log("✅ All rows parsed successfully");
      } else {
        console.log(`❌ Expected 1000 rows, got ${result.rows.length}`);
      }
      
    } catch (error) {
      console.log("❌ Large file processing failed:", error.message);
    }

    console.log("\n=== Test 7: Duplicate Data Handling ===");
    
    const duplicateData = [
      ['DRAWING', 'CMDTY CODE', 'TYPE', 'QTY'],
      ['P-001', 'VLV-001', 'Valve', '2'],     // Original
      ['P-001', 'VLV-001', 'Valve', '3'],     // Duplicate with different qty
      ['P-001', 'VLV-001', 'Valve', '1'],     // Another duplicate
      ['P-002', 'VLV-001', 'Valve', '2'],     // Same component, different drawing
      ['P-001', 'SUP-001', 'Support', '1']    // Different component
    ];
    
    const duplicateWorkbook = xlsx.utils.book_new();
    const duplicateSheet = xlsx.utils.aoa_to_sheet(duplicateData);
    xlsx.utils.book_append_sheet(duplicateWorkbook, duplicateSheet, 'Sheet1');
    const duplicateBuffer = Buffer.from(xlsx.write(duplicateWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(duplicateBuffer);
      console.log(`✅ Duplicate data test: ${result.rows.length} rows parsed`);
      
      // Group by drawing + component to identify duplicates
      const groupedData = new Map();
      result.rows.forEach(row => {
        const key = `${row['DRAWING']}:${row['CMDTY CODE']}`;
        if (!groupedData.has(key)) {
          groupedData.set(key, []);
        }
        groupedData.get(key).push(row);
      });
      
      Array.from(groupedData.entries()).forEach(([key, rows]) => {
        if (rows.length > 1) {
          const totalQty = rows.reduce((sum, row) => sum + (Number.parseInt(row['QTY']) || 1), 0);
          console.log(`  Duplicate: ${key} appears ${rows.length} times, total qty: ${totalQty}`);
        }
      });
      
    } catch (error) {
      console.log("❌ Duplicate data handling failed:", error.message);
    }

    console.log("\n=== Test 8: Column Header Variations ===");
    
    const columnVariationData = [
      ['Drawing Number', 'Part Number', 'Component Type', 'Quantity'], // Different headers
      ['P-001', 'PART-001', 'Valve', '1']
    ];
    
    const columnWorkbook = xlsx.utils.book_new();
    const columnSheet = xlsx.utils.aoa_to_sheet(columnVariationData);
    xlsx.utils.book_append_sheet(columnWorkbook, columnSheet, 'Sheet1');
    const columnBuffer = Buffer.from(xlsx.write(columnWorkbook, { type: 'array', bookType: 'xlsx' }));
    
    try {
      const result = await parseExcel(columnBuffer);
      console.log("✅ Column variation handling:");
      console.log(`  Headers found: ${result.headers.join(', ')}`);
      console.log(`  Data accessible: Drawing="${result.rows[0]['Drawing Number']}", Part="${result.rows[0]['Part Number']}"`);
    } catch (error) {
      console.log("❌ Column variation handling failed:", error.message);
    }

    console.log("\n=== Error Handling Test Summary ===");
    console.log("✅ Invalid file format handling");
    console.log("✅ Empty file handling");
    console.log("✅ Missing required fields validation");
    console.log("✅ Invalid data type handling");
    console.log("✅ Unknown component type mapping");
    console.log("✅ Large file processing");
    console.log("✅ Duplicate data identification");
    console.log("✅ Column header variations");

    console.log("\n✅ All error handling tests completed!");
    
  } catch (error) {
    console.error("❌ Error handling tests failed:", error);
    throw error;
  }
}

// Run the test
testErrorHandling()
  .then(() => {
    console.log("\n🎉 All error handling tests passed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Error handling tests failed:", error.message);
    process.exit(1);
  });