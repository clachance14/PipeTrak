# Session Update Command

Update existing project documentation with current session status without creating new handoff files.

## Instructions for Claude

When this command is invoked, please:

1. **Analyze Current State**
   - Check git status for uncommitted changes
   - Review the todo list for completed and pending tasks
   - Identify current development phase from build-plan.md
   - Compare with the latest handoff to identify what changed in this session

2. **Smart Documentation Updates** (ONLY update if actual changes detected):
   
   ### Files to Check and Update:
   
   - **`project-documentation/build-plan.md`**
     - Update phase status if phase completed or significant progress made
     - Mark completed tasks with ✅
     - Update "Current Status" section
   
   - **`project-documentation/changelog.md`**
     - Add entry ONLY if significant user-facing features were completed
     - Format: `## [Date] - Feature/Fix description`
   
   - **`project-documentation/dev-runbook.md`**
     - Add new patterns discovered
     - Document solutions to problems encountered
     - Add new commands or scripts created
   
   - **`project-documentation/phase[N]-verification.md`**
     - Update completion checklist for current phase
     - Add test results if tests were run
     - Document any issues or deviations

3. **Generate Update Summary**
   Display a concise summary showing:
   ```
   SESSION UPDATE SUMMARY
   ======================
   Time: [Current time]
   Phase: [Current phase from build-plan.md]
   
   Completed Tasks:
   - [Task 1 from todo list]
   - [Task 2 from todo list]
   
   Files Modified:
   - [List of files changed in git status]
   
   Documentation Updated:
   - [Only list docs that were actually updated]
   
   Next Steps:
   - [Immediate next task from build-plan.md]
   ```

4. **Decision Criteria for Updates**:
   
   ### When to update build-plan.md:
   - Phase status changed (e.g., "In Progress" → "Complete")
   - Major milestone reached
   - Significant tasks completed (mark with ✅)
   
   ### When to update changelog.md:
   - New feature fully implemented and working
   - Bug fix that affects user experience
   - API endpoint completed
   - UI component finished
   
   ### When to update dev-runbook.md:
   - Discovered new pattern or best practice
   - Solved a non-obvious problem
   - Created reusable script or command
   - Found important configuration requirement
   
   ### When to update phase verification:
   - Completed items in the phase checklist
   - Ran tests with results to document
   - Encountered and resolved issues

5. **What NOT to Do**:
   - Don't create new handoff files
   - Don't update documentation without actual changes
   - Don't duplicate information already in docs
   - Don't update if only minor code edits were made

## Usage

To run this command:
```
Update the session documentation
```

Or:
```
Execute .claude/commands/update-session.md
```

## Difference from Handoff Command

| Aspect | Handoff Command | Update Session Command |
|--------|----------------|----------------------|
| Creates new files | Yes (handoff-*.md) | No |
| Updates existing docs | Sometimes | Yes (if changes detected) |
| When to use | End of session | During session |
| Output | Full handoff document | Brief summary |
| Purpose | Session transition | Incremental updates |

## Example Output

```
SESSION UPDATE SUMMARY
======================
Time: January 8, 2025 at 3:45 PM
Phase: Phase 3 - API Development

Completed Tasks:
✅ Created component CRUD endpoints
✅ Added validation middleware
✅ Implemented error handling

Files Modified:
- packages/api/src/routes/pipetrak/components.ts
- packages/api/src/middleware/validation.ts
- packages/api/tests/components.test.ts

Documentation Updated:
- build-plan.md: Marked API tasks complete
- changelog.md: Added component API feature
- phase3-verification.md: Updated test results

Next Steps:
- Implement import API endpoint
- Add rate limiting
```

This command ensures documentation stays current without creating unnecessary files.