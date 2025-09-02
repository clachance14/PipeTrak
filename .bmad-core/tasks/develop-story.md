# Develop Story Task

## Purpose
Implement a user story by executing tasks sequentially with comprehensive testing and validation.

## Prerequisites
- Story file exists and is not in draft mode
- Story has clear tasks and acceptance criteria
- Development environment is set up
- Core configuration loaded

## Order of Execution
1. Read (first or next) task
2. Implement Task and its subtasks
3. Write tests
4. Execute validations
5. Only if ALL pass, then update the task checkbox with [x]
6. Update story section File List to ensure it lists any new or modified or deleted source file
7. Repeat order-of-execution until complete

## Story File Updates (ONLY)
**CRITICAL: ONLY UPDATE THE STORY FILE WITH UPDATES TO SECTIONS INDICATED BELOW. DO NOT MODIFY ANY OTHER SECTIONS.**

### Authorized Sections to Edit:
- Tasks / Subtasks Checkboxes
- Dev Agent Record section and all its subsections
- Agent Model Used
- Debug Log References  
- Completion Notes List
- File List
- Change Log
- Status

### FORBIDDEN Sections:
- DO NOT modify Status, Story, Acceptance Criteria, Dev Notes, Testing sections, or any other sections not listed above

## Blocking Conditions
HALT for:
- Unapproved dependencies needed, confirm with user
- Ambiguous requirements after story check
- 3 failures attempting to implement or fix something repeatedly
- Missing configuration
- Failing regression

## Ready for Review Criteria
- Code matches requirements
- All validations pass
- Follows coding standards
- File List complete

## Completion Process
1. All Tasks and Subtasks marked [x] and have tests
2. Validations and full regression passes (DON'T BE LAZY, EXECUTE ALL TESTS and CONFIRM)
3. Ensure File List is Complete
4. Run the task execute-checklist for the checklist story-dod-checklist
5. Set story status: 'Ready for Review'
6. HALT

## Dependencies
- execute-checklist.md
- story-dod-checklist.md
- Core configuration for coding standards