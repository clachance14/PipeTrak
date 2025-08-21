const fs = require('fs');
const path = require('path');

// Test the field weld CSV parsing and validation
async function testFieldWeldValidation() {
  try {
    // Read the CSV file
    const csvPath = '/home/clachance14/projects/PipeTrak/test-field-welds-complete.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('Testing field weld CSV validation...');
    console.log('CSV Content:');
    console.log(csvContent);
    console.log('\n');
    
    // Parse CSV manually to check data
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('Headers found:', headers);
    
    // Parse each data row
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
      
      console.log(`Row ${i}:`, row);
      
      // Check for specific field weld QC fields
      const qcFields = ['Weld Size', 'Schedule', 'Base Metal', 'X-ray Percent', 'PWHT Required', 'NDE Types'];
      console.log('QC Fields present:');
      qcFields.forEach(field => {
        console.log(`  ${field}: ${row[field] || 'NOT FOUND'}`);
      });
      console.log('---');
    }
    
    // Test API call to upload and validate this data
    console.log('\nTesting API upload...');
    
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath), {
      filename: 'test-field-welds.csv',
      contentType: 'text/csv'
    });
    
    const uploadResponse = await fetch('http://localhost:3001/api/pipetrak/import/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token', // You might need a real token
      }
    });
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', uploadResult);
      
      // Check if QC fields are preserved in the parsed data
      if (uploadResult.uploadData && uploadResult.uploadData.data) {
        const firstRow = uploadResult.uploadData.data[0];
        console.log('First row from API:', firstRow);
        
        const qcFieldsApi = ['weldSize', 'schedule', 'baseMetal', 'xrayPercent', 'pwhtRequired', 'ndeTypes'];
        console.log('API QC Fields:');
        qcFieldsApi.forEach(field => {
          console.log(`  ${field}: ${firstRow[field] !== undefined ? firstRow[field] : 'NOT FOUND'}`);
        });
      }
    } else {
      console.log('Upload failed:', uploadResponse.status, await uploadResponse.text());
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFieldWeldValidation();