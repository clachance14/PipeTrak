# ROC Component Type Alignment Matrix

## Executive Summary
This document provides a comprehensive matrix mapping all PipeTrak component types to their Rules of Credit (ROC) weights, workflow types, and milestone sets. This ensures proper credit allocation and progress tracking across all component categories.

## Component Type to ROC Matrix

### Full View Matrix

| Component Type | Workflow Type | Milestone Set | Receive | Erect | Fabricate | Connect | Install | Support | Punch | Test | Restore | Insulate | Metal Out | Primer | Finish | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Spool** | milestone_discrete | Full | 5% | 30% | - | 30% | - | 15% | 5% | 10% | 5% | - | - | - | - | **100%** |
| **Piping (footage)** | milestone_quantity | Full | 5% | 30% | - | 30% | - | 15% | 5% | 10% | 5% | - | - | - | - | **100%** |
| **Support** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Valve** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Fitting** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Flange** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Gasket** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Instrument** | milestone_discrete | Reduced | 10% | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Field Weld** | milestone_discrete | Reduced | 10%* | - | - | - | 60% | - | 10% | 15% | 5% | - | - | - | - | **100%** |
| **Threaded Pipe** | milestone_partial | Custom | - | 25% | 25% | 30% | - | - | 5% | 10% | 5% | - | - | - | - | **100%** |
| **Insulation** | milestone_quantity | Two-step | - | - | - | - | - | - | - | - | - | 60% | 40% | - | - | **100%** |
| **Paint** | milestone_quantity | Two-step | - | - | - | - | - | - | - | - | - | - | - | 40% | 60% | **100%** |

*Field Weld uses "Fit-up Ready" as the Receive milestone

## Detailed Component Type Specifications

### 1. Piping Components

#### Spool (milestone_discrete)
- **Workflow**: Individual component tracking with discrete checkboxes
- **ROC Distribution**: Full milestone set (7 milestones)
- **Key Milestones**:
  - Receive (5%): Material received on site
  - Erect (30%): Component positioned/erected
  - Connect (30%): Connected to adjacent components
  - Support (15%): Properly supported per spec
  - Punch (5%): Punch list items resolved
  - Test (10%): Pressure/system test complete
  - Restore (5%): Insulation/paint restored

#### Piping by Footage (milestone_quantity)
- **Workflow**: Quantity-based tracking (feet/meters)
- **ROC Distribution**: Full milestone set (7 milestones)
- **Calculation**: (quantity installed ÷ total quantity) × milestone weight
- **Use Case**: Large bore piping tracked by linear footage

#### Threaded Pipe (milestone_partial)
- **Workflow**: Percentage entry for partial completion
- **ROC Distribution**: Custom set with fabrication
- **Unique Feature**: Includes 25% Fabricate milestone
- **Calculation**: Partial percentages allowed per milestone

### 2. Mechanical Components

#### Valve (milestone_discrete)
- **Workflow**: Per-component checkbox tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Combined Milestone**: Install/Connect at 60%
- **Critical Path**: Often on critical path due to testing requirements

#### Fitting (milestone_discrete)
- **Workflow**: Individual fitting tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Installation Focus**: 60% weight on installation
- **Types**: Elbows, tees, reducers, couplings, unions, caps, plugs, nipples, bushings
- **ID Generation**: Auto-generates as FITTING-XXX when no commodity code provided

#### Flange (milestone_discrete)
- **Workflow**: Per-flange tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Installation Focus**: 60% weight on installation
- **Types**: Weld neck, slip-on, socket weld, threaded, lap joint, blind, spectacle blind
- **Face Types**: Raised face (RF), ring type joint (RTJ), flat face (FF)
- **ID Generation**: Auto-generates as FLANGE-XXX when no commodity code provided

#### Support (milestone_discrete)
- **Workflow**: Individual support tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Installation Focus**: 60% weight on installation
- **Types**: Spring hangers, rigid supports, guides, anchors

#### Gasket (milestone_discrete)
- **Workflow**: Per-gasket tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Bundle Tracking**: Can be tracked as bundles per flange pair
- **Quality Critical**: Test milestone crucial for leak prevention

### 3. Instrumentation & Controls

#### Instrument (milestone_discrete)
- **Workflow**: Individual instrument tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Types**: Transmitters, gauges, switches, analyzers
- **Commissioning**: Test includes loop checks and calibration

### 4. Field Work Components

#### Field Weld (milestone_discrete)
- **Workflow**: Per-weld tracking
- **ROC Distribution**: Reduced set (5 milestones)
- **Special Note**: "Receive" = Fit-up Ready status
- **QC Critical**: Requires weld inspection before test

### 5. Secondary Systems

#### Insulation (milestone_quantity)
- **Workflow**: Square footage or linear footage tracking
- **ROC Distribution**: Two-step process
- **Milestones**:
  - Insulate (60%): Insulation material installed
  - Metal Out (40%): Cladding/jacketing complete
- **Dependencies**: Cannot start until piping test complete

#### Paint (milestone_quantity)
- **Workflow**: Square footage tracking
- **ROC Distribution**: Two-step process
- **Milestones**:
  - Primer (40%): Surface prep and primer application
  - Finish Coat (60%): Final coating system applied
- **Weather Dependent**: Requires specific conditions

## Workflow Type Characteristics

### milestone_discrete
- **Input Method**: Checkboxes (Yes/No)
- **Progress Calculation**: Sum of completed milestone weights
- **Components**: Spool, Support, Valve, Gasket, Instrument, Field Weld
- **Best For**: Individual trackable components

### milestone_partial
- **Input Method**: Percentage sliders/input
- **Progress Calculation**: (Entered % × milestone weight) for each milestone
- **Components**: Threaded Pipe
- **Best For**: Components with gradual completion

### milestone_quantity
- **Input Method**: Quantity entry (feet, square feet, etc.)
- **Progress Calculation**: (Quantity complete ÷ Total quantity) × milestone weight
- **Components**: Piping footage, Insulation, Paint
- **Best For**: Bulk materials tracked by measurement

## ROC Weight Rationale

### Heavy Front-Loading (Erect/Connect)
- **Spool & Piping**: 60% combined for Erect + Connect
- **Rationale**: Major labor and equipment commitment
- **Risk Mitigation**: Reflects actual cost/schedule impact

### Installation-Focused (Install/Connect)
- **Valves, Supports, Gaskets**: 60% for installation
- **Rationale**: Single major activity for these components
- **Efficiency**: Reduces tracking overhead

### Test Weighting
- **Standard Components**: 10-15% for test
- **Rationale**: Reflects commissioning importance
- **Gate Function**: Cannot proceed without test completion

### Completion Activities
- **Punch (5%)**: Minor corrections and adjustments
- **Restore (5%)**: Final touchup and restoration
- **Rationale**: Small but necessary for true completion

## Implementation Considerations

### 1. Component Type Standardization
```typescript
enum ComponentType {
  // Piping Components
  SPOOL = 'SPOOL',
  PIPING_FOOTAGE = 'PIPING_FOOTAGE',
  THREADED_PIPE = 'THREADED_PIPE',
  FITTING = 'FITTING',         // NEW: Added for pipe fittings
  
  // Mechanical Components
  VALVE = 'VALVE',
  FLANGE = 'FLANGE',          // NEW: Added for flanges
  GASKET = 'GASKET',
  SUPPORT = 'SUPPORT',
  
  // Field Work
  FIELD_WELD = 'FIELD_WELD',
  
  // Instrumentation
  INSTRUMENT = 'INSTRUMENT',
  
  // Secondary Systems
  INSULATION = 'INSULATION',
  PAINT = 'PAINT',
  
  // Generic
  OTHER = 'OTHER'
}
```

### 2. ROC Template Mapping
```typescript
const ROC_TEMPLATES = {
  FULL: ['SPOOL', 'PIPING_FOOTAGE'],
  REDUCED: ['VALVE', 'FITTING', 'FLANGE', 'GASKET', 'SUPPORT', 'INSTRUMENT', 'FIELD_WELD'],
  THREADED: ['THREADED_PIPE'],
  INSULATION: ['INSULATION'],
  PAINT: ['PAINT']
};
```

### 3. Validation Rules
- Total ROC weights must equal 100% per component type
- Milestone names must match exactly for calculations
- Workflow type must align with component type

## Gap Analysis & Recommendations

### Identified Gaps

1. **Recently Added Component Types** ✅
   - Fitting (Added 2025-08-12)
   - Flange (Added 2025-08-12)

2. **Still Missing Component Types**
   - Equipment (pumps, compressors, vessels)
   - Electrical components
   - Civil/structural elements
   - Specialty items (strainers, filters, traps)

2. **Workflow Limitations**
   - No workflow for inspection hold points
   - Limited support for rework tracking
   - No partial credit for failed tests

3. **ROC Flexibility**
   - No project-specific ROC overrides currently
   - Cannot handle union vs non-union differences
   - No climate/region adjustments

### Recommendations

1. **Immediate Actions**
   - Standardize component type values in database
   - Create validation for ROC weight totals
   - Implement type-to-ROC mapping table

2. **Phase 2 Enhancements**
   - Add equipment component types
   - Create custom ROC templates per organization
   - Enable project-level ROC overrides

3. **Long-term Improvements**
   - Machine learning for ROC optimization
   - Historical data analysis for weight refinement
   - Integration with scheduling systems

## Validation Checklist

### Data Integrity
- [ ] All component types have defined ROC weights
- [ ] ROC weights sum to 100% for each type
- [ ] Workflow types match component characteristics
- [ ] Milestone names are consistent across types

### Import Processing
- [ ] Component type detection is accurate
- [ ] ROC assignment happens automatically
- [ ] Fallback rules exist for unknown types
- [ ] Validation prevents invalid combinations

### Reporting Accuracy
- [ ] Progress calculations use correct weights
- [ ] ROC-weighted totals aggregate properly
- [ ] Component type filters work correctly
- [ ] Credit distribution is traceable

## Quick Reference Card

### Component Type → Milestone Set
- **Full Set**: Spool, Piping (footage)
- **Reduced Set**: Valve, Fitting, Flange, Gasket, Support, Instrument, Field Weld
- **Custom Threaded**: Threaded Pipe
- **Two-Step Insulation**: Insulation
- **Two-Step Paint**: Paint

### Workflow Type → Input Method
- **discrete**: Checkboxes (Yes/No)
- **partial**: Percentage entry (0-100%)
- **quantity**: Measurement entry (ft, sq ft, etc.)

### Major Milestone Weights
- **Erect/Fabricate**: 25-30%
- **Connect/Install**: 30-60%
- **Test**: 10-15%
- **Support**: 15% (where applicable)

## Appendix: Sample ROC Calculations

### Example 1: Spool with 3 Milestones Complete
```
Component: SPOOL-001
Completed: Receive ✓, Erect ✓, Connect ✓
Calculation: 5% + 30% + 30% = 65% complete
Credits Earned: 65 of 100
```

### Example 2: Insulation 75% Complete
```
Component: INSUL-AREA-01
Insulate: 500 sq ft of 500 sq ft (100% × 60% = 60%)
Metal Out: 250 sq ft of 500 sq ft (50% × 40% = 20%)
Total Progress: 60% + 20% = 80% complete
Credits Earned: 80 of 100
```

### Example 3: Threaded Pipe Partial
```
Component: THREAD-042
Fabricate: 100% complete (100% × 25% = 25%)
Erect: 60% complete (60% × 25% = 15%)
Connect: 0% complete (0% × 30% = 0%)
Total Progress: 25% + 15% + 0% = 40% complete
Credits Earned: 40 of 100
```

---

*Document Version: 1.1*
*Author: Sarah (Product Owner)*
*Date: 2025-08-12*
*Last Updated: 2025-08-12 - Added Fitting and Flange component types*
*Purpose: ROC Component Type Alignment Reference*