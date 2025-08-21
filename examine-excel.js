const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file to understand its structure
const filePath = '/home/clachance14/projects/PipeTrak/project-documentation/TAKEOFF - 5932.xlsx';

try {
  console.log('📊 Examining Excel file:', filePath);
  
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  
  console.log('📑 Worksheets found:', workbook.SheetNames);
  
  // Get the first worksheet
  const worksheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[worksheetName];
  
  console.log(`\n📋 Examining worksheet: ${worksheetName}`);
  
  // Convert to JSON to see the data structure
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n📏 Total rows: ${jsonData.length}`);
  
  if (jsonData.length > 0) {
    console.log('\n🏷️  Column headers (first row):');
    const headers = jsonData[0];
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}`);
    });
    
    console.log('\n📄 Sample data (first 5 rows):');
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      console.log(`Row ${i + 1}:`, jsonData[i]);
    }
    
    // Look for quantity-related columns
    console.log('\n🔍 Searching for quantity-related columns...');
    const quantityColumns = headers.filter((header, index) => {
      const headerStr = String(header).toLowerCase();
      const isQuantityRelated = headerStr.includes('qty') || 
                               headerStr.includes('quantity') || 
                               headerStr.includes('count') ||
                               headerStr.includes('total') ||
                               headerStr.includes('each');
      if (isQuantityRelated) {
        console.log(`   Found: Column ${index + 1} - "${header}"`);
        
        // Show some sample values from this column
        const sampleValues = [];
        for (let row = 1; row < Math.min(6, jsonData.length); row++) {
          if (jsonData[row] && jsonData[row][index] !== undefined) {
            sampleValues.push(jsonData[row][index]);
          }
        }
        console.log(`   Sample values: [${sampleValues.join(', ')}]`);
      }
      return isQuantityRelated;
    });
    
    if (quantityColumns.length === 0) {
      console.log('   ⚠️  No obvious quantity columns found!');
      console.log('   💡 Looking for columns with numeric values that might represent quantities...');
      
      headers.forEach((header, index) => {
        // Check if this column has mostly numeric values
        let numericCount = 0;
        let totalValues = 0;
        
        for (let row = 1; row < Math.min(10, jsonData.length); row++) {
          if (jsonData[row] && jsonData[row][index] !== undefined && jsonData[row][index] !== '') {
            totalValues++;
            const value = jsonData[row][index];
            if (!isNaN(Number(value)) && Number(value) > 0) {
              numericCount++;
            }
          }
        }
        
        if (totalValues > 0 && numericCount / totalValues > 0.7) {
          console.log(`   Possible quantity column: "${header}" (${numericCount}/${totalValues} numeric values)`);
          
          // Show sample values
          const sampleValues = [];
          for (let row = 1; row < Math.min(6, jsonData.length); row++) {
            if (jsonData[row] && jsonData[row][index] !== undefined) {
              sampleValues.push(jsonData[row][index]);
            }
          }
          console.log(`   Sample values: [${sampleValues.join(', ')}]`);
        }
      });
    }
  }
  
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
}