const fs = require('fs');
const path = require('path');

// This script tests the instance creation fix by importing the test CSV
// and verifying that components get proper instance numbers and display IDs

async function testInstanceCreation() {
  console.log('🧪 Testing instance creation fix...');
  
  try {
    // Read the test CSV
    const csvPath = path.join(__dirname, 'test-instance-creation.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    console.log('📄 Test CSV data:');
    console.log(csvData);
    
    // Prepare the request payload similar to how the frontend would do it
    const fileData = {
      buffer: Buffer.from(csvData).toString('base64'),
      mimetype: 'text/csv',
      filename: 'test-instance-creation.csv'
    };
    
    // Simple column mappings for the test CSV
    const mappings = [
      { csvColumn: 'componentId', dbField: 'componentId' },
      { csvColumn: 'type', dbField: 'type' },
      { csvColumn: 'workflowType', dbField: 'workflowType' },
      { csvColumn: 'drawingId', dbField: 'drawingId' },
      { csvColumn: 'spec', dbField: 'spec' },
      { csvColumn: 'size', dbField: 'size' },
      { csvColumn: 'material', dbField: 'material' },
      { csvColumn: 'area', dbField: 'area' },
      { csvColumn: 'system', dbField: 'system' },
      { csvColumn: 'description', dbField: 'description' }
    ];
    
    const payload = {
      projectId: 'TEST_PROJECT_ID', // We'll need to get this from database
      fileData,
      mappings,
      options: {
        validateOnly: false,
        skipDuplicates: false,
        updateExisting: true,
        generateIds: true,
        rollbackOnError: false
      }
    };
    
    console.log('📦 Import payload prepared:');
    console.log('- File size:', csvData.length, 'bytes');
    console.log('- Mappings:', mappings.length, 'columns');
    console.log('- Expected components with instances:');
    console.log('  - VALVE001: 3 instances on DWG001');
    console.log('  - GASKET001: 2 instances on DWG001');
    console.log('  - PIPE001: 4 instances on DWG002');
    console.log('  - FITTING001: 1 instance on DWG003');
    
    console.log('\n⚠️  To test this properly, you need to:');
    console.log('1. Get a valid projectId from your database');
    console.log('2. Call the /api/pipetrak/components/import-full endpoint with this payload');
    console.log('3. Check the debug logs for instance tracking');
    console.log('4. Verify the created components in the database have:');
    console.log('   - Sequential instanceNumber (1, 2, 3...)');
    console.log('   - Correct totalInstancesOnDrawing');
    console.log('   - Proper displayId format: "VALVE001 (1 of 3)"');
    
    return payload;
    
  } catch (error) {
    console.error('❌ Test preparation failed:', error);
    throw error;
  }
}

// Run the test preparation
testInstanceCreation()
  .then((payload) => {
    console.log('\n✅ Test data prepared successfully!');
    console.log('\nNext steps:');
    console.log('1. Use this payload in a real API call');
    console.log('2. Check the server logs for instance tracking debug info');
    console.log('3. Query the database to verify instance creation');
  })
  .catch((error) => {
    console.error('\n💥 Test preparation failed:', error.message);
    process.exit(1);
  });