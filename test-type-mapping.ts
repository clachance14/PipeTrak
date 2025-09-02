#!/usr/bin/env node

// Comprehensive type mapping test for ImportWizard V2
import { ComponentTypeMapper } from "./packages/api/src/lib/import/type-mapper";

async function testTypeMapping() {
  console.log("🧪 Testing Component Type Mapping for ImportWizard V2\n");
  
  const typeMapper = new ComponentTypeMapper();
  
  // Test cases with expected mappings
  const testCases = [
    // Valve variations
    { input: "Valve", expected: "VALVE" },
    { input: "VALVE", expected: "VALVE" },
    { input: "VLV", expected: "VALVE" },
    { input: "Gate Valve", expected: "VALVE" },
    { input: "Check Valve", expected: "VALVE" },
    { input: "Ball Valve", expected: "VALVE" },
    { input: "Butterfly Valve", expected: "VALVE" },
    { input: "Globe Valve", expected: "VALVE" },
    { input: "Plug Valve", expected: "VALVE" },
    { input: "Needle Valve", expected: "VALVE" },
    { input: "Pressure Relief Valve", expected: "VALVE" },
    { input: "Safety Valve", expected: "VALVE" },
    { input: "Control Valve", expected: "VALVE" },
    
    // Support variations
    { input: "Support", expected: "SUPPORT" },
    { input: "SUPPORT", expected: "SUPPORT" },
    { input: "SUP", expected: "SUPPORT" },
    { input: "Pipe Support", expected: "SUPPORT" },
    { input: "Hanger", expected: "SUPPORT" },
    { input: "Guide", expected: "SUPPORT" },
    { input: "Anchor", expected: "SUPPORT" },
    { input: "Spring Hanger", expected: "SUPPORT" },
    { input: "Rigid Hanger", expected: "SUPPORT" },
    
    // Gasket variations
    { input: "Gasket", expected: "GASKET" },
    { input: "GASKET", expected: "GASKET" },
    { input: "GSK", expected: "GASKET" },
    { input: "Seal", expected: "GASKET" },
    { input: "O-Ring", expected: "GASKET" },
    { input: "Spiral Wound", expected: "GASKET" },
    { input: "Full Face", expected: "GASKET" },
    { input: "Raised Face", expected: "GASKET" },
    
    // Flange variations
    { input: "Flange", expected: "FLANGE" },
    { input: "FLANGE", expected: "FLANGE" },
    { input: "FLG", expected: "FLANGE" },
    { input: "Weld Neck Flange", expected: "FLANGE" },
    { input: "Slip On Flange", expected: "FLANGE" },
    { input: "Socket Weld Flange", expected: "FLANGE" },
    { input: "Threaded Flange", expected: "FLANGE" },
    { input: "Blind Flange", expected: "FLANGE" },
    { input: "Lap Joint Flange", expected: "FLANGE" },
    
    // Fitting variations
    { input: "Fitting", expected: "FITTING" },
    { input: "FITTING", expected: "FITTING" },
    { input: "FTG", expected: "FITTING" },
    { input: "Elbow", expected: "FITTING" },
    { input: "Tee", expected: "FITTING" },
    { input: "Reducer", expected: "FITTING" },
    { input: "Cap", expected: "FITTING" },
    { input: "Coupling", expected: "FITTING" },
    { input: "Union", expected: "FITTING" },
    { input: "Cross", expected: "FITTING" },
    { input: "Nipple", expected: "FITTING" },
    { input: "Bushing", expected: "FITTING" },
    { input: "Plug", expected: "FITTING" },
    
    // Instrument variations
    { input: "Instrument", expected: "INSTRUMENT" },
    { input: "INSTRUMENT", expected: "INSTRUMENT" },
    { input: "INST", expected: "INSTRUMENT" },
    { input: "Gauge", expected: "INSTRUMENT" },
    { input: "Transmitter", expected: "INSTRUMENT" },
    { input: "Sensor", expected: "INSTRUMENT" },
    { input: "Indicator", expected: "INSTRUMENT" },
    { input: "Switch", expected: "INSTRUMENT" },
    { input: "Meter", expected: "INSTRUMENT" },
    
    // Pipe variations
    { input: "Pipe", expected: "PIPE" },
    { input: "PIPE", expected: "PIPE" },
    { input: "Piping", expected: "PIPE" },
    { input: "Line", expected: "PIPE" },
    { input: "Tube", expected: "PIPE" },
    { input: "Tubing", expected: "PIPE" },
    
    // Spool variations
    { input: "Spool", expected: "SPOOL" },
    { input: "SPOOL", expected: "SPOOL" },
    { input: "SPL", expected: "SPOOL" },
    { input: "Prefab", expected: "SPOOL" },
    { input: "Shop Spool", expected: "SPOOL" },
    { input: "Field Spool", expected: "SPOOL" },
    { input: "Iso Spool", expected: "SPOOL" },
    
    // Field Weld variations
    { input: "Field Weld", expected: "FIELD_WELD" },
    { input: "FIELD_WELD", expected: "FIELD_WELD" },
    { input: "FW", expected: "FIELD_WELD" },
    { input: "Weld", expected: "FIELD_WELD" },
    { input: "Field Joint", expected: "FIELD_WELD" },
    { input: "Site Weld", expected: "FIELD_WELD" },
    
    // Unknown types (should map to MISC)
    { input: "Unknown Type", expected: "MISC" },
    { input: "Random Component", expected: "MISC" },
    { input: "", expected: "MISC" },
    { input: "   ", expected: "MISC" },
    { input: "Weird Part", expected: "MISC" },
  ];
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  console.log("=== Running Type Mapping Tests ===");
  
  for (const testCase of testCases) {
    const result = typeMapper.mapType(testCase.input);
    
    if (result === testCase.expected) {
      console.log(`✅ "${testCase.input}" → ${result}`);
      passed++;
    } else {
      console.log(`❌ "${testCase.input}" → ${result} (expected: ${testCase.expected})`);
      failed++;
      failures.push({ input: testCase.input, actual: result, expected: testCase.expected });
    }
  }
  
  console.log("\n=== Type Mapping Results ===");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${testCases.length}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);
  
  if (failures.length > 0) {
    console.log("\n=== Failure Details ===");
    failures.forEach(failure => {
      console.log(`  Input: "${failure.input}"`);
      console.log(`  Expected: ${failure.expected}`);
      console.log(`  Actual: ${failure.actual}\n`);
    });
  }
  
  // Test batch processing with statistics
  console.log("\n=== Testing Batch Processing ===");
  const sampleTypes = [
    "Gate Valve", "Support", "Gasket", "Flange", "Elbow",
    "Gauge", "Pipe", "Spool", "Field Weld", "Unknown Item",
    "Check Valve", "Hanger", "O-Ring", "Tee", "Transmitter"
  ];
  
  const stats = typeMapper.getTypeCounts(sampleTypes);
  
  console.log("📊 Type statistics:");
  Object.entries(stats).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  });
  
  console.log("\n✅ Type mapping test completed!");
  return failed === 0;
}

// Run the test
testTypeMapping()
  .then(success => {
    console.log(success ? "\n🎉 All type mapping tests passed!" : "\n⚠️ Some type mapping tests failed!");
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("❌ Type mapping test failed:", error);
    process.exit(1);
  });