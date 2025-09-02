import { ExcelProcessor, ColumnMapper, DataValidator, } from '../../../packages/api/src/lib/file-processing';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Handle SSL issues with Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function testExcelImport() {
  console.log('🧪 Testing Excel import after ComponentType enum fix...');
  
  try {
    const filePath = '/home/clachance14/projects/PipeTrak/PipeTrak_Import_Template_2025-08-12 (1).xlsx';
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at: ${filePath}`);
    }
    
    console.log('📄 Reading Excel file...');
    const buffer = fs.readFileSync(filePath);
    
    // Parse Excel
    const excelProcessor = new ExcelProcessor();
    const { headers, rows, metadata } = await excelProcessor.parseExcel(buffer);
    
    console.log(`✅ Excel parsed: ${headers.length} columns, ${rows.length} rows`);
    console.log('📋 Headers:', headers);
    
    // Auto-map columns
    const mapper = new ColumnMapper();
    const mappings = mapper.autoMapColumns(headers);
    
    console.log('🔗 Column mappings:');
    mappings.forEach(mapping => {
      console.log(`   ${mapping.sourceColumn} → ${mapping.targetField}`);
    });
    
    // Validate data
    const validator = new DataValidator();
    const validationResult = await validator.validateComponentData(rows.slice(0, 5), mappings);
    
    console.log('\n📊 Validation results (first 5 rows):');
    console.log(`   Valid rows: ${validationResult.validRows.length}`);
    console.log(`   Invalid rows: ${validationResult.invalidRows.length}`);
    console.log(`   Errors: ${validationResult.errors.length}`);
    console.log(`   Warnings: ${validationResult.warnings.length}`);
    
    if (validationResult.errors.length > 0) {
      console.log('\n❌ Validation errors:');
      validationResult.errors.slice(0, 5).forEach(error => {
        console.log(`   Row ${error.row}: ${error.field} - ${error.error} (value: ${error.value})`);
      });
    } else {
      console.log('\n✅ No validation errors found!');
      console.log('\n📝 Sample valid row:');
      console.log('   ', JSON.stringify(validationResult.validRows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testExcelImport()
  .then(() => {
    console.log('\n🎉 Excel import test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Excel import test failed:', error.message);
    process.exit(1);
  });