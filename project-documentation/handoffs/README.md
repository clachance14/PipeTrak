# PipeTrak Session Handoffs

This folder contains session handoff documents that capture the state of development at specific points in time.

## Purpose

Session handoffs serve multiple critical functions:
- **Context Preservation**: Capture the exact state when ending a session
- **Continuity**: Enable smooth resumption of work in new sessions or after context clearing
- **History**: Maintain a record of development progress and decisions
- **Documentation**: Update project docs only when there are actual changes

## How to Use the Handoff Command

To generate a handoff document, simply tell Claude:
```
Run the handoff command
```

Or more explicitly:
```
Execute .claude/commands/handoff.md
```

## What the Command Does

1. **Analyzes Current State**
   - Reviews git status for uncommitted changes
   - Checks todo list for completed tasks
   - Identifies current development phase
   - Compares with previous handoff

2. **Creates Timestamped Handoff**
   - Saves to `handoff-YYYY-MM-DD-HHMM.md` in this folder
   - Documents session accomplishments
   - Lists modified files
   - Captures key decisions

3. **Smart Documentation Updates**
   - Only updates docs that have actual changes:
     - `build-plan.md` - Phase status updates
     - `phase[N]-verification.md` - Phase completion docs
     - `changelog.md` - Significant features
     - `dev-runbook.md` - New patterns/issues

4. **Generates Restoration Prompt**
   - Ready-to-paste prompt for new sessions
   - Includes current state and next steps
   - References key documentation

## Handoff Structure

Each handoff document contains:
- **Session Summary**: Work completed, decisions made
- **Project State**: Current phase, environment status
- **Critical Files**: Prioritized list for next session
- **Quick Start**: Commands to resume development
- **Next Steps**: Immediate tasks with agent recommendations
- **Restoration Prompt**: Copy-paste ready for new sessions

## Best Practices

### When to Create a Handoff
- End of a work session
- Before clearing context
- After completing a major milestone
- When switching to a different task
- Before a break in development

### What Makes a Good Handoff
- **Specific**: List exact files modified and tasks completed
- **Actionable**: Clear next steps with commands ready to run
- **Contextual**: Include decisions and reasoning, not just facts
- **Minimal**: Only update docs that actually changed

### Using Previous Handoffs
When starting a new session:
1. Check the latest handoff in this folder
2. Use the restoration prompt to quickly get Claude up to speed
3. Review the "Next Steps" section
4. Continue from where the previous session left off

## File Naming Convention

Handoffs are named with timestamps:
```
handoff-YYYY-MM-DD-HHMM.md
```

Example: `handoff-2025-01-08-1730.md`

This ensures:
- Chronological ordering
- No naming conflicts
- Easy identification of session timing

## Integration with Project Documentation

> **📋 Current Project Status**: See [MASTER-STATUS.md](../MASTER-STATUS.md) for the single source of truth on project status, feature completion, and implementation details.

Handoffs complement but don't duplicate other docs:
- **MASTER-STATUS.md**: Single source of truth for project status (replaces multiple status docs)
- **build-plan.md**: Master roadmap (updated when phases complete)
- **phase[N]-verification.md**: Detailed phase completion records
- **changelog.md**: User-facing feature history
- **dev-runbook.md**: Technical patterns and solutions

The handoff command intelligently determines which docs need updates based on actual session changes.

## Archive Policy

To maintain clean documentation:
- **Active Handoffs**: Only the most recent handoff is kept in this folder
- **Archived Handoffs**: Older handoffs are moved to `../archive/handoffs-YYYY/`
- **Archive Schedule**: Documents older than 30 days or when more than 2-3 handoffs accumulate

### Archived Locations
- `../archive/old-handoffs/` - Pre-2025 handoffs  
- `../archive/handoffs-2025/` - 2025 handoffs

## Quick Reference

### Generate a handoff:
```
Run the handoff command
```

### Find the latest handoff:
```bash
ls -t project-documentation/handoffs/handoff-*.md | head -1
```

### Read the latest handoff:
```
Read the latest handoff document in project-documentation/handoffs/
```

---

*This system ensures efficient session management and documentation consistency throughout the PipeTrak development process.*