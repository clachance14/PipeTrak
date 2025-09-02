# Execute Checklist Task

## Purpose
Execute a specific checklist systematically, ensuring all items are completed and documented.

## Parameters
- **checklist**: The name of the checklist to execute (without .md extension)

## Steps

### 1. Load Checklist
Load the specified checklist from the checklists directory.

### 2. Present Checklist
Display the checklist items to the user with numbered options for easy selection.

### 3. Execute Items
For each checklist item:
- Present the item clearly
- Allow user to mark as complete or request assistance
- Document any issues or notes
- Ensure understanding before proceeding

### 4. Validation
- Verify all items are completed
- Confirm any dependencies are met
- Document completion status

### 5. Summary
Provide a summary of:
- Items completed
- Any issues encountered
- Recommendations for next steps

## Output Format
```
Checklist: [Checklist Name]
Status: [In Progress/Complete]

Items:
[ ] Item 1 - Description
[x] Item 2 - Description (Completed)
[ ] Item 3 - Description

Notes:
- Any relevant notes or issues

Completion Summary:
- X of Y items completed
- Next steps if applicable
```

## Dependencies
- Specified checklist file from checklists/ directory