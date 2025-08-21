// Simple test for component import functionality
const fs = require('fs');

async function testComponentImport() {
  try {
    // Read the test CSV file
    const csvContent = fs.readFileSync('test-import.csv', 'utf8');
    console.log('CSV Content:', csvContent);
    
    // Parse CSV manually for testing
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    console.log('Parsed data:');
    console.log('Headers:', headers);
    console.log('Rows:', rows.length);
    console.log('Sample row:', rows[0]);
    
    // Create file data similar to what the upload endpoint creates
    const fileData = {
      buffer: Buffer.from(csvContent).toString('base64'),
      mimetype: 'text/csv',
      originalName: 'test-import.csv',
      size: csvContent.length,
      uploadedAt: new Date(),
      projectId: 'test-project-id'
    };
    
    // Create mappings similar to what the frontend creates
    const mappings = [
      { sourceColumn: 'componentId', targetField: 'componentId' },
      { sourceColumn: 'type', targetField: 'type' },
      { sourceColumn: 'workflowType', targetField: 'workflowType' },
      { sourceColumn: 'drawingId', targetField: 'drawingId' },
      { sourceColumn: 'spec', targetField: 'spec' },
      { sourceColumn: 'size', targetField: 'size' },
      { sourceColumn: 'material', targetField: 'material' },
      { sourceColumn: 'area', targetField: 'area' },
      { sourceColumn: 'system', targetField: 'system' },
      { sourceColumn: 'description', targetField: 'description' }
    ];
    
    console.log('Test data prepared successfully!');
    console.log('File size:', fileData.size);
    console.log('Mappings count:', mappings.length);
    
    // In a real test, we would POST this to the import-full endpoint
    // For now, just verify the data structure is correct
    const payload = {
      projectId: 'test-project-id',
      fileData,
      mappings,
      options: {
        validateOnly: false,
        skipDuplicates: false,
        updateExisting: true,
        generateIds: true,
        rollbackOnError: false,
      }
    };
    
    console.log('Payload structure ready');
    console.log('Payload keys:', Object.keys(payload));
    console.log('✅ Test data preparation successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testComponentImport();
