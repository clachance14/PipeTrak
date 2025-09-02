// Simple test to validate field weld data mapping
const fs = require('fs');

// Simulate CSV parsing
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] ? values[index].trim() : '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      row[header] = value;
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

// Simulate column mapping
function applyColumnMappings(rows, mappings) {
  return rows.map((row, index) => {
    const mappedData = {};
    
    for (const mapping of mappings) {
      const sourceValue = row[mapping.sourceColumn];
      const targetValue = sourceValue;
      
      // Clean up empty values for optional fields
      if (targetValue === '' || targetValue === null || targetValue === undefined) {
        const optionalFields = [
          'spec', 'size', 'material', 'pressureRating', 'description', 'area', 'system', 
          'testPackage', 'testPressure', 'testRequired', 'totalLength', 'lengthUnit', 
          'totalQuantity', 'quantityUnit', 'milestoneTemplateId',
          // Field weld specific fields
          'weldSize', 'schedule', 'weldTypeCode', 'baseMetal', 'xrayPercent', 
          'pwhtRequired', 'ndeTypes', 'welderId', 'dateWelded', 'tieInNumber', 'comments'
        ];
        if (!optionalFields.includes(mapping.targetField)) {
          mappedData[mapping.targetField] = targetValue;
        }
        // Optional fields with empty values are simply omitted
      } else {
        mappedData[mapping.targetField] = targetValue;
      }
    }
    
    return mappedData;
  });
}

// Test the field weld data
const csvContent = fs.readFileSync('/home/clachance14/projects/PipeTrak/test-field-welds-complete.csv', 'utf-8');
console.log('Testing field weld CSV parsing and mapping...\n');

const parsed = parseCSV(csvContent);
console.log('Parsed headers:', parsed.headers);
console.log('Number of rows:', parsed.rows.length);

// Create mappings based on the CSV headers
const mappings = [
  { sourceColumn: 'Weld ID', targetField: 'componentId' },
  { sourceColumn: 'Component Type', targetField: 'type' },
  { sourceColumn: 'Drawing ID', targetField: 'drawingId' },
  { sourceColumn: 'Weld Size', targetField: 'weldSize' },
  { sourceColumn: 'Schedule', targetField: 'schedule' },
  { sourceColumn: 'Base Metal', targetField: 'baseMetal' },
  { sourceColumn: 'X-ray Percent', targetField: 'xrayPercent' },
  { sourceColumn: 'PWHT Required', targetField: 'pwhtRequired' },
  { sourceColumn: 'NDE Types', targetField: 'ndeTypes' },
  { sourceColumn: 'Welder Stencil', targetField: 'welderId' },
  { sourceColumn: 'Date Welded', targetField: 'dateWelded' },
  { sourceColumn: 'Area', targetField: 'area' },
  { sourceColumn: 'System', targetField: 'system' },
  { sourceColumn: 'Test Package', targetField: 'testPackage' },
  { sourceColumn: 'Comments', targetField: 'comments' }
];

console.log('\nApplying column mappings...');
const mappedRows = applyColumnMappings(parsed.rows, mappings);

console.log('\nMapped data for first row:');
console.log(JSON.stringify(mappedRows[0], null, 2));

console.log('\nQC Fields check:');
const firstRow = mappedRows[0];
const qcFields = ['weldSize', 'schedule', 'baseMetal', 'xrayPercent', 'pwhtRequired', 'ndeTypes'];
qcFields.forEach(field => {
  console.log(`  ${field}: ${firstRow[field] !== undefined ? firstRow[field] : 'MISSING'}`);
});

console.log('\n✅ Test complete! The field weld QC data should now be preserved.');