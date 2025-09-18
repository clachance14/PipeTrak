# Milestone Dependency Rules - Construction Workflow Logic

**Version**: 2.0  
**Date**: January 2025  
**Applies To**: Mobile Milestone UI Redesign  

---

## Overview

This document defines the milestone dependency logic that governs the order in which construction milestones can be completed in PipeTrak. The rules are designed to match real-world construction practices while maintaining quality control and safety requirements.

## Core Dependency Principles

### 1. Flexible Middle Phase
Construction work often requires flexibility in the order of installation activities. The middle phase milestones (ERECT, CONNECT, SUPPORT) can be completed in any order after material is received, reflecting real construction practices.

### 2. Controlled Endpoints
Quality control and safety require specific sequences at the beginning and end of the construction process:
- **RECEIVE** must always be first
- **PUNCH → TEST → RESTORE** sequence is mandatory

### 3. Real-World Scenarios Supported
- Field welding before pipe erection
- Support installation before piping
- Partial installation while waiting for adjacent components
- Quality control gates that cannot be bypassed

---

## Standard Component Workflow Rules

### RECEIVE Milestone
- **Prerequisites**: None (always available first)
- **Purpose**: Material delivered and received on site
- **Blocks**: Nothing (other milestones can wait)
- **Special Notes**: Must be completed before any installation work

### ERECT Milestone
- **Prerequisites**: RECEIVE only
- **Purpose**: Component positioned and erected in place
- **Blocks**: Nothing (can erect before connecting)
- **Real-World Example**: Positioning pipe on hangers

### CONNECT Milestone  
- **Prerequisites**: RECEIVE only
- **Purpose**: Connected to adjacent components
- **Blocks**: Nothing (can connect before erecting)
- **Real-World Example**: Making field weld before lifting into position

### SUPPORT Milestone
- **Prerequisites**: RECEIVE only  
- **Purpose**: Hangers, supports, and guides installed
- **Blocks**: Nothing (supports can go in anytime)
- **Real-World Example**: Installing hangers before or after piping

### PUNCH Milestone
- **Prerequisites**: ALL installation milestones complete
  - For Standard Components: ERECT + CONNECT + SUPPORT
  - For Valves/Instruments: INSTALL
- **Purpose**: Punch list items cleared
- **Blocks**: TEST milestone
- **Quality Gate**: Cannot proceed to testing until punch complete

### TEST Milestone
- **Prerequisites**: PUNCH complete
- **Purpose**: System or pressure testing complete
- **Blocks**: RESTORE milestone
- **Quality Gate**: Cannot restore until testing passes

### RESTORE Milestone
- **Prerequisites**: TEST complete
- **Purpose**: Insulation, fireproofing, paint restoration
- **Blocks**: Nothing (final milestone)
- **Final Step**: Marks component 100% complete

---

## Field Weld Special Workflow

Field welds have a unique sequence that follows welding quality standards (AWS D1.1, ASME B31.3, API 1104):

### FIT (Fit-up) Milestone
- **Prerequisites**: None (can fit-up anytime)
- **Purpose**: Pipe ends prepared and fit-up complete
- **Blocks**: WELD milestone
- **Quality Gate**: Must have proper fit-up before welding

### WELD (Welding) Milestone
- **Prerequisites**: FIT complete
- **Purpose**: Welding process complete
- **Blocks**: VT milestone
- **Special Requirements**: 
  - Welder assignment required
  - Welder certification validation
- **Quality Gate**: Cannot inspect until welding complete

### VT (Visual Test) Milestone
- **Prerequisites**: WELD complete
- **Purpose**: Visual inspection complete
- **Blocks**: RT/UT milestone
- **Quality Gate**: Must pass visual before NDT

### RT/UT (Radiographic/Ultrasonic Test) Milestone
- **Prerequisites**: VT complete
- **Purpose**: Non-destructive testing complete
- **Blocks**: PUNCH milestone
- **Auto-Population**: Based on x-ray percentage from import
- **Quality Gate**: Must meet acceptance criteria

### PUNCH → TEST → RESTORE
- Same sequence as standard components
- PUNCH requires RT/UT complete (or VT if no NDT required)

---

## Validation Logic Implementation

### canCompleteMilestone() Function
```typescript
function canCompleteMilestone(milestone: Milestone, allMilestones: Milestone[]): boolean {
  const rules = MILESTONE_DEPENDENCY_RULES[milestone.type];
  
  // Check all required prerequisites
  for (const requiredType of rules.requires) {
    const requiredMilestone = allMilestones.find(m => m.type === requiredType);
    if (requiredMilestone && !requiredMilestone.isCompleted) {
      return false; // Prerequisite not met
    }
  }
  
  return true; // All prerequisites satisfied
}
```

### canUncompleteMilestone() Function
```typescript
function canUncompleteMilestone(milestone: Milestone, allMilestones: Milestone[]): boolean {
  // Find milestones that depend on this one
  const dependentMilestones = allMilestones.filter(m => {
    const rules = MILESTONE_DEPENDENCY_RULES[m.type];
    return rules.requires.includes(milestone.type) && m.isCompleted;
  });
  
  // Cannot uncomplete if other milestones depend on it
  return dependentMilestones.length === 0;
}
```

### Dependency Rules Configuration
```typescript
const MILESTONE_DEPENDENCY_RULES = {
  RECEIVE: {
    requires: [],
    enables: ['ERECT', 'CONNECT', 'SUPPORT', 'INSTALL']
  },
  
  ERECT: {
    requires: ['RECEIVE'],
    enables: ['PUNCH'] // (along with CONNECT + SUPPORT)
  },
  
  CONNECT: {
    requires: ['RECEIVE'],
    enables: ['PUNCH'] // (along with ERECT + SUPPORT)
  },
  
  SUPPORT: {
    requires: ['RECEIVE'], 
    enables: ['PUNCH'] // (along with ERECT + CONNECT)
  },
  
  INSTALL: { // For valves/instruments
    requires: ['RECEIVE'],
    enables: ['PUNCH']
  },
  
  PUNCH: {
    requires: ['ERECT', 'CONNECT', 'SUPPORT'], // OR ['INSTALL']
    enables: ['TEST']
  },
  
  TEST: {
    requires: ['PUNCH'],
    enables: ['RESTORE']
  },
  
  RESTORE: {
    requires: ['TEST'],
    enables: []
  }
};
```

---

## Real-World Construction Scenarios

### Scenario 1: Pre-Fabrication Workflow
**Common Practice**: Weld pipe sections on ground before erecting

```
1. ✅ RECEIVE - Material delivered
2. ✅ CONNECT - Make field weld on ground
3. ✅ ERECT - Lift welded section into position
4. ✅ SUPPORT - Install hangers
5. ✅ PUNCH - Clear punch items
6. ✅ TEST - Pressure test
7. ✅ RESTORE - Apply insulation
```

### Scenario 2: Support-First Installation
**Common Practice**: Install supports before piping for precise alignment

```
1. ✅ RECEIVE - Material delivered
2. ✅ SUPPORT - Install hangers and guides first
3. ✅ ERECT - Place pipe on pre-installed supports
4. ✅ CONNECT - Make final connections
5. ✅ PUNCH - Clear punch items
6. ✅ TEST - Pressure test
7. ✅ RESTORE - Apply insulation
```

### Scenario 3: Partial Installation
**Common Practice**: Install what you can while waiting for adjacent work

```
1. ✅ RECEIVE - Material delivered
2. ✅ ERECT - Position pipe in place
3. ⭕ CONNECT - Waiting for adjacent component
4. ✅ SUPPORT - Install supports (can proceed)
5. ⭕ PUNCH - Cannot start until CONNECT complete
```

### Scenario 4: Field Weld Quality Sequence
**Required Practice**: NDT testing sequence for critical welds

```
1. ✅ FIT - Fit-up pipes
2. ✅ WELD - Complete welding (welder assigned)
3. ✅ VT - Visual inspection passes
4. ✅ RT - X-ray testing passes (80% coverage)
5. ✅ PUNCH - Clear weld-related punch items
6. ✅ TEST - System test includes weld joints
7. ✅ RESTORE - Apply protective coating
```

---

## Error Scenarios and Handling

### Blocked Milestone Attempt
**Scenario**: User tries to complete TEST before PUNCH
**System Response**: 
- Button shows blocked state (gray with lock)
- Tooltip: "Complete PUNCH milestone first"
- No update attempt made

### Dependent Milestone Uncomplete Attempt  
**Scenario**: User tries to uncomplete PUNCH when TEST is complete
**System Response**:
- Button shows dependent state (green with yellow border)
- Tooltip: "Uncomplete TEST milestone first"
- Requires dependency chain uncomplete

### Missing Prerequisites
**Scenario**: User tries to complete CONNECT without RECEIVE
**System Response**:
- Button disabled/grayed out
- Clear error message
- Links to required prerequisite

---

## Component Type Variations

### Standard Components (Spool, Pipe)
- Uses full 7-milestone sequence
- All milestones available (REC, ERC, CON, SUP, PCH, TST, RST)
- Flexible middle phase (ERECT/CONNECT/SUPPORT)

### Valves and Instruments  
- Uses simplified sequence with INSTALL milestone
- INSTALL replaces ERECT + CONNECT + SUPPORT
- Sequence: RECEIVE → INSTALL → PUNCH → TEST → RESTORE

### Field Welds
- Uses specialized welding sequence
- Includes quality control gates
- Welder assignment validation
- NDT requirements based on specifications

### Supports and Hangers
- Simplified sequence
- No connection requirements
- Focus on installation and testing

---

## Business Rule Exceptions

### Emergency Bypass (Admin Only)
- **Use Case**: Emergency repairs or non-standard installations
- **Requirements**: Admin role + justification comment
- **Audit Trail**: All bypasses logged with reason
- **Validation**: Cannot bypass safety-critical gates (TEST before RESTORE)

### Field Change Authorization
- **Use Case**: Field conditions require sequence modification
- **Requirements**: Foreman approval + documentation
- **Tracking**: Field change logged in audit system
- **Review**: Engineering review for critical changes

---

## Testing and Validation

### Unit Test Coverage
- All dependency combinations tested
- Edge cases and error scenarios covered
- Performance testing with large milestone sets
- Cross-component dependency validation

### Integration Testing  
- API endpoint validation
- Database constraint enforcement
- Real-time update synchronization
- Offline queue dependency handling

### Business Logic Testing
- Construction workflow scenarios
- Field weld quality sequences
- Component type variations
- Error recovery and rollback

---

This milestone dependency system balances construction flexibility with quality control requirements, ensuring that PipeTrak supports real-world construction practices while maintaining safety and compliance standards.