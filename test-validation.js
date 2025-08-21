// Test the field weld data validation directly
const { ComponentImportSchema } = require('./packages/api/src/lib/file-processing.ts');

// Test data from the CSV file
const testFieldWeldData = {
  componentId: "FW-001",
  type: "FIELD_WELD", 
  drawingId: "P-35F11",
  weldSize: "6\"",
  schedule: "Sch 40",
  baseMetal: "A106 Gr B",
  xrayPercent: "100",
  pwhtRequired: "TRUE",
  ndeTypes: "RT,PT",
  welderId: "WLD001",
  dateWelded: "2025-01-15",
  area: "Unit 1",
  system: "Main Steam",
  testPackage: "TP-001",
  comments: "Shop weld full penetration"
};

console.log('Testing field weld data validation...');
console.log('Input data:', testFieldWeldData);

try {
  const result = ComponentImportSchema.parse(testFieldWeldData);
  console.log('\n✅ Validation PASSED!');
  console.log('Parsed result:', result);
  
  // Check specific QC fields
  console.log('\n📊 QC Fields preserved:');
  console.log('  weldSize:', result.weldSize);
  console.log('  schedule:', result.schedule);
  console.log('  baseMetal:', result.baseMetal);
  console.log('  xrayPercent:', result.xrayPercent, '(type:', typeof result.xrayPercent, ')');
  console.log('  pwhtRequired:', result.pwhtRequired, '(type:', typeof result.pwhtRequired, ')');
  console.log('  ndeTypes:', result.ndeTypes, '(type:', typeof result.ndeTypes, ')');
  
} catch (error) {
  console.log('\n❌ Validation FAILED!');
  console.error('Error:', error.errors || error.message);
}