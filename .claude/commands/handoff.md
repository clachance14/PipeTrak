# Linear Session Handoff Generator

Generate a comprehensive Linear-based handoff for the current PipeTrak development session, replacing markdown files with trackable Linear issues.

## Instructions for Claude

When this command is invoked, please:

0. **First, Ask for Session Context**
   - Ask the user: "Please provide the current date and time (format: MM-DD-YY H:MM am/pm, example: 8-7-25 9:45pm)"
   - Ask: "What were you working on this session? (e.g., 'debugging CSV import', 'implementing user auth', 'fixing dashboard performance')"
   - Ask: "How long have you been working on this? (e.g., '2 hours', '30 minutes', 'all day')"
   - Wait for their responses and use throughout the handoff

1. **Analyze Current Development State**
   - Check git status for uncommitted changes
   - Review recent file modifications and their context
   - Identify current development phase from build-plan.md
   - Check for any error logs, console outputs, or failing tests
   - Compare with recent Linear issues to understand the current work thread

2. **Create Main Session Handoff Issue** in Linear:
   - **Title**: `Session Handoff: [Work Description] - [Date]`
   - **Description**: Comprehensive session summary including:
     - Date, time, and session duration
     - What was being worked on
     - Current state of the code/feature
     - Git branch and commit status
     - Development environment details
   - **Labels**: `Documentation`, `Session-Handoff`, `[Current-Phase]`
   - **Priority**: Medium (always accessible but not urgent)

3. **Document What We Tried (Critical Section)**:
   - **Create "Attempted Solutions" issue** with:
     - **Title**: `Attempted Solutions: [Work Description] - [Date]`
     - **Description**: Detailed list of:
       - Each approach we tried
       - Why each approach failed
       - Error messages or symptoms encountered
       - Time spent on each attempt
       - Code changes that were reverted
       - External resources consulted
   - **Labels**: `Failed-Attempts`, `Knowledge-Base`, `[Component-Area]`
   - **Link to main handoff issue**

4. **Create Resumption Strategy Issues**:
   - **"Next Steps" issue** with:
     - **Title**: `Resume: [Work Description] - Next Actions`
     - **Description**: 
       - Immediate next steps to try
       - Alternative approaches to investigate
       - Specific files to examine
       - Commands to run for context restoration
     - **Labels**: `Next-Session`, `Action-Required`
     - **Priority**: High (first thing to work on)
   
   - **"Investigation Tasks" issues** (one per approach):
     - **Title**: `Investigate: [Specific Approach]`
     - **Description**: Detailed research task with success criteria
     - **Labels**: `Research`, `Alternative-Approach`

5. **Create Technical Context Issues**:
   - **"Environment State" issue**:
     - Current dependencies and versions
     - Database schema state
     - Environment variables and configurations
     - Known working/broken features
   
   - **"Code State" issue**:
     - Branch status and uncommitted changes
     - Recently modified files with explanations
     - Any temporary debugging code or console.logs
     - Database migrations that need attention

6. **Link Issues in Logical Chain**:
   - Main handoff → links to all other issues
   - Attempted solutions → links to next steps
   - Next steps → links to specific investigation tasks
   - Use Linear's "blocks/blocked by" relationships appropriately

7. **Update Project Documentation in Linear**:
   - Create/update "Build Plan Progress" issue if phase status changed
   - Create "Documentation Needed" issues for:
     - Any new patterns discovered
     - Solutions that worked (for future reference)
     - Failed approaches (to avoid repeating)

8. **Generate Quick Resume Commands**:
   - Add to "Next Steps" issue:
   ```bash
   # Context restoration commands
   cd /home/clachance14/projects/PipeTrak
   git status  # Check for uncommitted changes
   git log --oneline -5  # Recent commits
   
   # Environment verification
   node --version && pnpm --version
   pnpm install  # Ensure dependencies current
   
   # Development startup
   pnpm dev  # Start development server
   pnpm db:studio  # Open database admin (if needed)
   
   # Check current work
   [Specific commands based on what was being worked on]
   ```

9. **Create Context Restoration Issue**:
   - **Title**: `Context: Resume [Work Description] - [Date]`
   - **Description**: Ready-to-paste prompt for new Claude Code session:
   ```
   I'm resuming work on PipeTrak where I left off [duration] ago.
   
   LAST SESSION CONTEXT:
   - Working on: [work description]
   - Duration: [session length]
   - Current state: [brief state]
   
   FAILED ATTEMPTS TO REVIEW:
   - Check Linear issue: "Attempted Solutions: [work] - [date]"
   
   IMMEDIATE NEXT STEPS:
   - Check Linear issue: "Resume: [work] - Next Actions"
   
   Please:
   1. Review the linked Linear issues for full context
   2. Check git status for any uncommitted changes  
   3. Suggest which of the "Next Actions" to tackle first
   4. Help me avoid repeating the failed attempts
   
   Current working directory: /home/clachance14/projects/PipeTrak
   ```
   - **Labels**: `Context-Restoration`, `New-Session`

10. **Set Up Epic/Project Organization**:
    - If this is part of a larger feature, link to appropriate Epic
    - If starting new work, create Epic for the feature area
    - Ensure all handoff issues are properly categorized

11. **Final Summary Display**:
    - List all Linear issues created with their URLs
    - Show the context restoration prompt for easy copying
    - Provide Linear board view link to see all related issues
    - Highlight the priority order for next session

## Output Format

After creating all Linear issues, provide a summary:

```markdown
# Linear Session Handoff Complete

## Issues Created:
1. **Main Handoff**: [Linear URL] - Session overview
2. **Attempted Solutions**: [Linear URL] - What didn't work
3. **Next Steps**: [Linear URL] - Immediate actions
4. **Context Restoration**: [Linear URL] - Resume prompt
5. **Investigation Tasks**: [Linear URLs] - Specific approaches to try

## Priority for Next Session:
1. Start with "Context Restoration" issue
2. Review "Attempted Solutions" to avoid repeating failures
3. Begin "Next Steps" issue tasks
4. If blocked, pick an "Investigation Task"

## Quick Links:
- Board View: [Linear board URL with filter]
- Epic: [Epic URL if applicable]

## Copy-Paste Resume Prompt:
[The context restoration content ready to paste]
```

## Benefits of This Approach:

- **Searchable History**: Find previous debugging sessions across the project
- **Linked Context**: See relationships between problems and solutions
- **Failed Attempts Archive**: Never repeat the same failed approach
- **Actionable Handoffs**: Each handoff creates concrete next steps
- **Collaborative Ready**: Easy to share context with other developers
- **Progress Tracking**: See development velocity and common blockers
- **Knowledge Base**: Build institutional knowledge of what works/doesn't work

Generate this Linear-based handoff now by analyzing the current project state and creating the appropriate issues.