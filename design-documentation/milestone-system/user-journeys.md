# User Journeys - Milestone Update System

## Primary User Personas

### Foreman (Mobile Field User)
**Context**: On-site with tablet/phone, often wearing gloves, working in dusty/wet conditions
**Primary Goal**: Quickly update component milestones as work progresses
**Pain Points**: Small touch targets, complex interfaces, slow loading, poor visibility outdoors

### Project Manager (Desktop/Office User) 
**Context**: Office environment with large monitor, mouse/keyboard
**Primary Goal**: Bulk milestone updates, progress reporting, data management
**Pain Points**: Repetitive individual updates, lack of bulk operations, slow Excel workflows

---

## Core User Journey: Single Milestone Update

### Scenario: Foreman marks pipe installation complete

**User**: Foreman Mike needs to mark milestone "Pipe Installed" as complete for component PIPE-001

#### Mobile Flow (Primary)
1. **Navigate to Component**
   - Open PipeTrak app on tablet
   - Navigate to Drawing P-35F11 via drawing tree
   - Find component PIPE-001 in component list (search/filter)

2. **Update Milestone**
   - Tap component card to open milestone sheet (bottom slide-up)
   - See milestone "Pipe Installed" with large checkbox (52px touch target)
   - Tap checkbox → immediate optimistic update shows checkmark + green color
   - Bottom toast shows "Milestone updated" with undo option
   - Sheet auto-closes after 2s or can be manually dismissed

3. **Validation & Sync**
   - Background API call confirms update
   - If successful: Green checkmark remains, completion % updates
   - If failed: Red error state, checkbox reverts, retry option shown

#### Desktop Flow (Secondary)
1. **Navigate to Component**
   - Click drawing in tree navigation 
   - Find component in data table (filter/search)
   
2. **Inline Update**
   - Click milestone cell in table → inline editor appears
   - Click checkbox → immediate visual feedback
   - Click outside or press Enter to save
   - Loading spinner in cell while saving

**Success Criteria**:
- ✅ Update completes in <3 taps on mobile
- ✅ Touch targets are ≥52px for gloved hands  
- ✅ Optimistic update provides instant feedback
- ✅ Error recovery is clear and actionable
- ✅ Progress automatically recalculates

---

## Core User Journey: Bulk Milestone Update

### Scenario: Project Manager marks 50 gaskets as "QC Checked"

**User**: PM Sarah needs to bulk update milestone "QC Checked" for all gaskets in Area 100A

#### Desktop Flow (Primary)
1. **Component Selection**
   - Filter component table: Area = "100A", Type contains "gasket"
   - Results show 47 gasket components
   - Click "Select All" checkbox in table header
   - Bulk action bar appears at bottom: "47 components selected"

2. **Bulk Update Modal**
   - Click "Update Milestones" in bulk action bar
   - Modal opens: "Bulk Update Milestones"
   - Choose workflow type: "Discrete (Checkbox)"
   - Select milestone: "QC Checked" from dropdown
   - Set action: "Mark as Complete"
   - Preview shows: "47 components will be updated"

3. **Execution & Progress**
   - Click "Update 47 Components" 
   - Progress modal shows: "Processing... 15 of 47 complete"
   - Real-time progress bar with estimated completion
   - Can cancel operation mid-process

4. **Results & Recovery**
   - Success: "45 of 47 milestones updated successfully"
   - Partial failure: "2 failed due to permission errors"
   - Failed items shown in expandable list with retry options
   - Option to undo all changes within 30 seconds

#### Mobile Flow (Adapted)
1. **Component Selection**
   - Use advanced search to filter to gaskets in Area 100A
   - Long-press first component to enter selection mode
   - Tap additional components to multi-select (max 25 on mobile)
   - Floating action button shows "12 selected"

2. **Simplified Bulk Update**
   - Tap floating action button → bottom sheet opens
   - Simple milestone picker: "QC Checked"
   - Large "Mark 12 Complete" button (60px height)
   - Progress shown in same bottom sheet

**Success Criteria**:
- ✅ Can bulk update 50+ milestones in <60 seconds
- ✅ Clear preview before applying changes
- ✅ Granular progress tracking during execution
- ✅ Robust error handling with retry options
- ✅ Undo capability for accidental bulk updates

---

## Core User Journey: Percentage Milestone Update

### Scenario: Foreman updates welding progress to 75%

**User**: Foreman Carlos needs to update milestone "Welding Complete" from 50% to 75% for valve V-203

#### Mobile Flow (Primary)
1. **Navigate to Component**
   - Search for "V-203" in component search
   - Tap component card in results

2. **Percentage Update**
   - Milestone sheet shows "Welding Complete" at 50%
   - Large slider with 75% label above (60px touch area)
   - Drag slider thumb to 75% or tap to position
   - Live preview shows percentage updating
   - Optional: Tap percentage label to type exact value

3. **Alternative Input Methods**
   - Quick preset buttons: 25%, 50%, 75%, 100% (48px each)
   - Numeric input field with stepper controls (+/- buttons)
   - Voice input: "Set welding to seventy-five percent"

#### Desktop Flow  
1. **Inline Table Edit**
   - Click percentage cell in milestone column
   - Inline slider appears with input field
   - Drag slider or type value, press Enter to save
   - Progress bar updates in real-time

**Success Criteria**:
- ✅ Slider provides precise control with 5% increments
- ✅ Visual feedback shows progress immediately
- ✅ Alternative input methods for different preferences
- ✅ Validation prevents invalid percentages
- ✅ Auto-saves after 2 seconds of inactivity

---

## Core User Journey: Quantity Milestone Update

### Scenario: Foreman logs 8 of 12 bolts installed

**User**: Foreman Dave installing bolts on flange assembly FL-455, needs to update count

#### Mobile Flow (Primary)
1. **Navigate to Component**
   - Scan QR code on component tag → direct navigation to FL-455
   - Milestone sheet auto-opens to "Bolts Installed"

2. **Quantity Update**
   - Shows current: "3 of 12 bolts" (25% complete)  
   - Large numeric stepper: [−] [8] [+] (52px buttons)
   - Or tap number to open numeric keypad
   - Real-time progress bar: 8/12 = 67%
   - Unit label "bolts" clearly visible

3. **Smart Input Features**
   - Quick increment by common amounts: +1, +5
   - Voice input: "Eight bolts installed"
   - Photo capture to verify count
   - Cannot exceed maximum quantity (validation)

#### Desktop Flow
1. **Table Cell Edit**
   - Click quantity cell → inline stepper appears
   - Type quantity directly or use +/- controls
   - Progress calculation auto-updates

**Success Criteria**:
- ✅ Quick numeric input with stepper controls
- ✅ Clear visual indication of progress (8 of 12)
- ✅ Validation prevents impossible quantities  
- ✅ Multiple input methods (stepper, keypad, voice)
- ✅ Smart defaults and quick increment options

---

## Edge Case Journeys

### Offline Operation & Sync
**Scenario**: Foreman loses internet connection while updating milestones

1. **Offline Detection**
   - Connection lost indicator appears at top of screen
   - "Working Offline" badge shown prominently
   - All updates continue to work normally (queued locally)

2. **Offline Updates**
   - Milestone updates show "sync pending" indicator (cloud with clock icon)
   - Updates stored locally with timestamps
   - Visual differentiation of synced vs pending items

3. **Connection Restored**
   - "Syncing changes..." notification appears
   - Progress indicator for sync process
   - Conflict resolution if other users changed same data
   - Success confirmation when all changes synced

### Conflict Resolution
**Scenario**: Two users update the same milestone simultaneously

1. **Conflict Detection**
   - User A updates milestone to complete
   - User B simultaneously updates same milestone
   - Server detects conflict and notifies User B

2. **Resolution Interface**
   - Modal appears: "Conflict Detected"  
   - Shows both versions side-by-side
   - Options: "Use My Version", "Use Their Version", "Merge Changes"
   - Timestamp and user info for each version

3. **Merge & Continue**
   - User chooses resolution approach
   - System applies change and continues
   - Both users receive notification of resolution

### Error Recovery  
**Scenario**: Bulk update partially fails due to server error

1. **Graceful Failure**
   - Progress stops at 75% with clear error message
   - "Server connection lost - 15 of 20 updates pending"
   - Options: "Retry Failed", "Continue Later", "Cancel Remaining"

2. **Granular Recovery**
   - Shows list of specific failed components
   - Individual retry buttons for each failure
   - Option to modify problematic updates before retry
   - "Retry All" button for bulk retry

**Success Criteria for Edge Cases**:
- ✅ Clear offline/online status indicators
- ✅ Reliable local storage and sync
- ✅ Intuitive conflict resolution
- ✅ Granular error recovery options
- ✅ No data loss in any failure scenario

---

## Performance Requirements by Journey

| Journey Type | Load Time | Touch Response | Sync Time | Success Rate |
|--------------|-----------|----------------|-----------|--------------|
| Single Update | <1.5s | <50ms | <300ms | 99.9% |
| Bulk Update (50) | <2s | <100ms | <2s | 99% |  
| Offline Sync | N/A | <50ms | <5s | 99.5% |
| Error Recovery | <1s | <50ms | <1s | 100% |

## User Testing Validation

Each journey must pass field testing with:
- ✅ Construction workers wearing work gloves
- ✅ Outdoor lighting conditions (bright sun/shadow)
- ✅ Dusty tablet screens with reduced sensitivity  
- ✅ Network instability typical on construction sites
- ✅ Multi-generational users (25-65 age range)

This ensures our designs work in real industrial environments, not just office conditions.