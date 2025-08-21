#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

async function examineExcelTypes() {
  try {
    console.log('🔍 Examining Excel file types column...\n');

    const filePath = path.join(process.cwd(), '../../project-documentation/TAKEOFF - 5932.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}\n`);

    // Process each sheet
    for (const sheetName of sheetNames) {
      console.log(`\n📋 Sheet: ${sheetName}`);
      console.log('─'.repeat(60));
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (data.length === 0) {
        console.log('Empty sheet');
        continue;
      }

      // Find the header row
      const headerRow = data[0];
      console.log(`Headers: ${headerRow.join(', ')}`);
      
      // Find the "type" column index (case-insensitive)
      const typeColumnIndex = headerRow.findIndex((header: any) => 
        header && header.toString().toLowerCase() === 'type'
      );
      
      if (typeColumnIndex === -1) {
        console.log('⚠️  No "type" column found in this sheet');
        continue;
      }
      
      console.log(`\n✅ Found "type" column at index ${typeColumnIndex} (column ${String.fromCharCode(65 + typeColumnIndex)})`);
      
      // Collect unique types and their counts
      const typeCounts = new Map<string, number>();
      const typeExamples = new Map<string, string[]>();
      
      for (let i = 1; i < data.length && i < 1000; i++) { // Limit to first 1000 rows for analysis
        const row = data[i];
        const typeValue = row[typeColumnIndex];
        
        if (typeValue !== undefined && typeValue !== null && typeValue !== '') {
          const typeStr = String(typeValue).trim();
          
          // Count occurrences
          typeCounts.set(typeStr, (typeCounts.get(typeStr) || 0) + 1);
          
          // Collect example component IDs if available
          const componentIdIndex = headerRow.findIndex((header: any) => 
            header && (header.toString().toLowerCase() === 'componentid' || 
                      header.toString().toLowerCase() === 'component_id' ||
                      header.toString().toLowerCase() === 'tag' ||
                      header.toString().toLowerCase() === 'tag number')
          );
          
          if (componentIdIndex !== -1 && !typeExamples.has(typeStr)) {
            typeExamples.set(typeStr, []);
          }
          
          if (componentIdIndex !== -1 && typeExamples.get(typeStr)!.length < 3) {
            typeExamples.get(typeStr)!.push(String(row[componentIdIndex] || 'N/A'));
          }
        }
      }
      
      // Display type statistics
      console.log(`\n📊 Component Type Distribution (${typeCounts.size} unique types):`);
      console.log('─'.repeat(60));
      
      // Sort by count (descending)
      const sortedTypes = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      for (const [type, count] of sortedTypes) {
        const examples = typeExamples.get(type);
        const exampleStr = examples ? ` (e.g., ${examples.join(', ')})` : '';
        console.log(`  "${type}": ${count} components${exampleStr}`);
      }
      
      // Check for problematic types
      console.log('\n⚠️  Potential Issues:');
      console.log('─'.repeat(60));
      
      let issuesFound = false;
      
      // Check for empty/null types
      const emptyTypeCount = data.slice(1).filter(row => {
        const val = row[typeColumnIndex];
        return val === undefined || val === null || val === '';
      }).length;
      
      if (emptyTypeCount > 0) {
        console.log(`  - ${emptyTypeCount} rows with empty/null type values`);
        issuesFound = true;
      }
      
      // Check for types that don't match expected values
      const expectedTypes = [
        'VALVE', 'GASKET', 'SUPPORT', 'FITTING', 'FLANGE', 
        'INSTRUMENT', 'SPOOL', 'PIPING', 'FIELD_WELD', 
        'INSULATION', 'PAINT', 'OTHER'
      ];
      
      for (const [type, count] of sortedTypes) {
        const upperType = type.toUpperCase();
        if (!expectedTypes.includes(upperType) && 
            !expectedTypes.some(expected => upperType.includes(expected))) {
          console.log(`  - "${type}" (${count} rows) doesn't match expected component types`);
          issuesFound = true;
        }
      }
      
      if (!issuesFound) {
        console.log('  None detected');
      }
      
      // Suggest mappings
      console.log('\n💡 Suggested Type Mappings:');
      console.log('─'.repeat(60));
      
      for (const [type, count] of sortedTypes.slice(0, 10)) { // Show top 10
        const upperType = type.toUpperCase();
        let suggestion = 'OTHER';
        
        // Try to match to expected types
        if (upperType.includes('VALVE')) suggestion = 'VALVE';
        else if (upperType.includes('GASKET')) suggestion = 'GASKET';
        else if (upperType.includes('SUPPORT')) suggestion = 'SUPPORT';
        else if (upperType.includes('FITTING')) suggestion = 'FITTING';
        else if (upperType.includes('FLANGE')) suggestion = 'FLANGE';
        else if (upperType.includes('INSTRUMENT')) suggestion = 'INSTRUMENT';
        else if (upperType.includes('SPOOL')) suggestion = 'SPOOL';
        else if (upperType.includes('PIPING') || upperType.includes('PIPE')) suggestion = 'SPOOL';
        else if (upperType.includes('WELD') || upperType.includes('FW')) suggestion = 'FIELD_WELD';
        else if (upperType.includes('INSUL')) suggestion = 'INSULATION';
        else if (upperType.includes('PAINT')) suggestion = 'PAINT';
        
        if (type !== suggestion) {
          console.log(`  "${type}" → "${suggestion}"`);
        }
      }
      
      console.log('\n📝 Summary:');
      console.log(`  - Total rows: ${data.length - 1}`);
      console.log(`  - Unique types: ${typeCounts.size}`);
      console.log(`  - Most common type: "${sortedTypes[0][0]}" (${sortedTypes[0][1]} occurrences)`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

examineExcelTypes();