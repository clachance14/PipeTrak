# Session Handoff Generator

Generate a comprehensive handoff document for the current PipeTrak development session.

## Instructions for Claude

When this command is invoked, please:

0. **First, Ask for Date and Time**
   - Ask the user: "Please provide the current date and time (format: MM-DD-YY H:MM am/pm, example: 8-7-25 9:45pm)"
   - Wait for their response
   - Parse the input to create:
     - Filename format: `handoff-YYYY-MM-DD-HHMM.md` (e.g., "8-7-25 9:45pm" → "handoff-2025-08-07-2145.md")
     - Display format: "Month Day, Year at H:MM AM/PM" (e.g., "August 7, 2025 at 9:45 PM")
   - Use this timestamp throughout the handoff document

1. **Analyze Current State**
   - Check git status for uncommitted changes
   - Review the todo list to see what was completed
   - Identify which development phase we're in
   - Check recent file modifications
   - Compare with previous handoff to identify what changed

2. **Generate Session Summary** including:
   - Date and time of handoff
   - Phase completed or in progress
   - Major accomplishments from todo list
   - Key technical decisions made
   - Problems solved
   - Files created or modified

3. **Document Project State**:
   - Current phase from build-plan.md
   - Development environment status
   - Database connection status
   - Known issues or limitations
   - Any blocked tasks

4. **Smart Documentation Updates** (ONLY if changes detected):
   - Check if `build-plan.md` needs phase status updates
   - Update/create `phase[N]-verification.md` if phase completed
   - Add to `changelog.md` if significant features added
   - Update `dev-runbook.md` if new patterns or issues discovered
   - Only update files that have actual changes from the session

5. **List Critical Files for Next Session** (in priority order):
   - `CLAUDE.md` - Project guidelines
   - `project-documentation/prd.md` - Requirements
   - `project-documentation/build-plan.md` - Phase roadmap
   - `project-documentation/handoffs/[latest-handoff].md` - Previous session
   - `project-documentation/phase[N]-verification.md` (current phase)
   - `project-documentation/architecture-output.md` - Database schema
   - `packages/database/prisma/schema.prisma` - Data models
   - Any recently modified files from this session

6. **Provide Quick Start Commands**:
   ```bash
   # Environment verification
   node --version  # Should be >= 20
   pnpm --version  # Should be 9.3.0
   
   # Project setup
   cd /home/clachance14/projects/PipeTrak
   pnpm install
   
   # Start development
   pnpm dev
   
   # Database utilities
   pnpm db:generate  # Generate Prisma client
   pnpm db:push     # Push schema to Supabase
   pnpm db:studio   # Open Prisma Studio
   ```

7. **Identify Next Steps** from build-plan.md:
   - Immediate tasks to begin
   - Current phase tasks remaining
   - Any blockers or dependencies
   - Suggested agents to use with example prompts

8. **Generate Context Restoration Prompt** for the next session:
   ```
   I'm resuming work on PipeTrak, an industrial pipe tracking system built with Next.js, Supabase, and Supastarter.
   
   [Include current phase status]
   [Include last completed tasks]
   [Include immediate next steps]
   
   Please read:
   1. CLAUDE.md for project guidelines
   2. project-documentation/handoffs/[latest-handoff].md for session context
   3. project-documentation/[latest-verification].md for current status
   4. project-documentation/build-plan.md for next phase tasks
   ```

9. **Save and Display**:
   - Create `project-documentation/handoffs/` folder if it doesn't exist
   - Save the handoff to: `project-documentation/handoffs/handoff-[YYYY-MM-DD-HHMM].md`
   - Display the full handoff content to the user
   - Provide the restoration prompt separately for easy copying
   - List which project documentation files were updated (if any)

## Output Format

The handoff should be formatted as a markdown document with clear sections:

```markdown
# PipeTrak Development Session Handoff
**Generated**: [Date Time]
**Session Duration**: [If calculable]
**Developer**: Claude Code

## Session Summary
[What was accomplished]

## Current State
[Project status]

## Critical Files Reference
[Ordered list with descriptions]

## Quick Start Guide
[Commands and setup]

## Next Steps
[From build plan]

## Restoration Prompt
[Ready to paste]

## Notes
[Any important observations]
```

Generate this handoff now by analyzing the current project state.