#!/usr/bin/env node

/**
 * Test script for Progress Summary Report export functionality
 */

async function testExportEndpoint() {
  const projectId = 'clzqkwy020002ulsxy4f3k5i8';
  
  console.log('Testing Progress Summary Report Export Endpoint...\n');
  
  // Test data that matches what the frontend sends
  const testData = {
    projectId,
    weekEnding: '2025-08-18', // Next Sunday
    groupBy: 'area',
    format: 'csv',
    options: {
      showDeltas: true,
      includeZeroProgress: true,
      includeSubtotals: true,
      includeGrandTotal: true,
    }
  };
  
  console.log('Request payload:', JSON.stringify(testData, null, 2));
  console.log('\n✅ Export endpoint test data prepared successfully');
  console.log('\nTo test the export, navigate to:');
  console.log('http://localhost:3000/app/pipetrak/clzqkwy020002ulsxy4f3k5i8/reports');
  console.log('\n1. Generate the Progress Summary Report');
  console.log('2. Click on Export buttons (PDF, Excel, CSV)');
  console.log('3. Verify files download correctly with data');
}

testExportEndpoint().catch(console.error);