# Linear MCP Integration Guide

This document provides comprehensive guidance for using Linear via MCP (Model Context Protocol) integration for PipeTrak project management, bug tracking, and documentation.

## Overview

Linear is integrated through MCP commands that allow direct interaction with issues, projects, teams, and documentation. All Linear operations should follow the established workflow patterns and labeling conventions.

## PipeTrak Linear Structure

### Team Information
- **Team Name**: PipeTrak
- **Team ID**: `173da0c8-0e1e-4a5d-94b3-84d02bfbe593`
- **Linear URL**: https://linear.app/pipetrak

### Projects (Epics)

1. **Import/Export System** (`3592db90-78c1-4308-9a8d-bb4bdec0171d`)
   - CSV import validation and processing
   - Data export in various formats
   - Bulk operations and batch processing

2. **Dashboard & Analytics** (`a117ecb8-2d9c-4e08-889c-e99614a82b6e`)
   - Progress tracking and milestone visualization
   - Project analytics and reporting
   - Real-time data updates

3. **Drawing Navigation** (`f1d763ba-ba98-41fa-a2cc-2e27cd4b9d3d`)
   - Hierarchical tree view of drawings
   - Search and filtering capabilities
   - Navigation state management

4. **User Management** (`c5c32779-835a-4df5-96c5-1ec99e824c15`)
   - User registration and login
   - Role-based permissions
   - Organization management

5. **Database Optimization** (`7f5f47e5-a85e-4423-a0d2-b1d7e320d82a`)
   - Query optimization
   - Schema migrations
   - Data consistency

6. **Testing & QA** (`ae9c0c90-c5a4-4e13-a927-99f55d78354a`)
   - Unit test coverage
   - Integration testing
   - Performance testing

## Label System

### Session Management Labels
- **`Session-Handoff`** (#9B59B6): Session summary and state documentation
- **`Next-Session`** (#3498DB): Issues to tackle in next session
- **`Context-Restoration`** (#2ECC71): Environment and state setup notes

### Workflow State Labels
- **`Action-Required`** (#C0392B): Issues needing immediate attention
- **`Needs-Review`** (#F5A623): Ready for code review
- **`Needs-QA`** (#BD10E0): Ready for testing
- **`Blocked`** (#D0021B): Waiting on external dependency

### Knowledge & Learning Labels
- **`Knowledge-Base`** (#F39C12): Reusable learnings and patterns
- **`Investigation`** (#8E44AD): Research and exploration tasks
- **`Documentation`** (#37B4C3): Documentation updates
- **`Failed-Attempts`** (#E74C3C): Solutions that didn't work
- **`Alternative-Approach`** (#E67E22): Trying different solutions

### Priority Labels
- **`Priority: Critical`** (#FF0000): Blocks production or major functionality
- **`Priority: High`** (#FF6B6B): Important but not blocking
- **`Priority: Medium`** (#FFA500): Normal priority work
- **`Priority: Low`** (#4ECDC4): Nice to have, can wait

### Technical Area Labels
- **`Frontend`** (#5E6AD2): UI/React components
- **`Backend`** (#26B5CE): API/Database work
- **`Database`** (#0F7938): Schema/migrations
- **`Auth`** (#E362F5): Authentication/permissions
- **`Dashboard`** (#7A6FF0): Dashboard-specific work
- **`DevOps`** (#F2C94C): Infrastructure/deployment

### Issue Type Labels
- **`Bug`** (#EB5757): Bug reports and fixes
- **`Feature`** (#BB87FC): New functionality
- **`Improvement`** (#4EA7FC): Enhancements to existing features
- **`Tech Debt`** (#95999C): Refactoring/cleanup
- **`Security`** (#FF0000): Security-related work
- **`Performance`** (#EB5757): Performance improvements

### Environment & State Labels
- **`Environment-Issue`** (#D35400): Development environment problems
- **`Code-State`** (#16A085): Tracking code and branch state

## MCP Commands Reference

### Team Operations
```
mcp__linear__list_teams
mcp__linear__get_team(query: "PipeTrak")
```

### Issue Management

#### Creating Issues
```
mcp__linear__create_issue(
  title: "Issue title",
  team: "PipeTrak",
  description: "Detailed description in Markdown",
  project: "Import/Export System",  // or project ID
  labels: ["Bug", "Priority: High", "Backend"],
  assignee: "username"  // optional
)
```

#### Listing Issues
```
mcp__linear__list_issues(
  team: "PipeTrak",
  project: "Dashboard & Analytics",
  assignee: "username",
  state: "Todo",
  label: "Action-Required",
  query: "search text",
  limit: 50
)
```

#### Updating Issues
```
mcp__linear__update_issue(
  id: "issue_id",
  title: "Updated title",
  description: "Updated description",
  state: "In Progress",
  labels: ["Bug", "Priority: Medium", "Needs-Review"],
  assignee: "new_assignee"
)
```

#### Issue Details
```
mcp__linear__get_issue(id: "issue_id")
```

### Comments
```
mcp__linear__create_comment(
  issueId: "issue_id",
  body: "Comment content in Markdown"
)

mcp__linear__list_comments(issueId: "issue_id")
```

### Project Management
```
mcp__linear__list_projects(teamId: "173da0c8-0e1e-4a5d-94b3-84d02bfbe593")
mcp__linear__get_project(query: "Dashboard & Analytics")
mcp__linear__create_project(name: "New Epic", teamId: "173da0c8-0e1e-4a5d-94b3-84d02bfbe593")
```

### Labels
```
mcp__linear__list_issue_labels(team: "PipeTrak")
mcp__linear__create_issue_label(
  name: "New Label",
  color: "#FF0000",
  description: "Label description"
)
```

### Users
```
mcp__linear__list_users(query: "username")
mcp__linear__get_user(query: "username")
```

## Workflow Patterns

### Session Handoff Pattern
1. Create a `Session-Handoff` issue at the end of each development session
2. Document current code state, branch, and next steps
3. Tag with relevant project and technical area labels
4. Add any blocking issues or investigation results

### Bug Reporting Pattern
1. Create issue with `Bug` label and appropriate priority
2. Assign to relevant project (Import/Export, Dashboard, etc.)
3. Add technical area labels (Frontend, Backend, Database)
4. Include reproduction steps and expected vs actual behavior

### Knowledge Base Pattern
1. Create issues with `Knowledge-Base` label for reusable learnings
2. Document solutions, patterns, and gotchas
3. Reference related issues and failed attempts
4. Keep descriptions up-to-date as patterns evolve

### Investigation Pattern
1. Create issue with `Investigation` label for research tasks
2. Document findings, alternatives considered, and decisions made
3. Convert to `Knowledge-Base` when conclusions are reached
4. Link to any `Failed-Attempts` or `Alternative-Approach` issues

## Best Practices

### Issue Creation
- Always assign to appropriate project
- Use descriptive titles that clearly indicate the problem or feature
- Include relevant context in descriptions using Markdown
- Add priority and type labels
- Reference related issues using Linear's linking syntax

### Label Usage
- Use exactly one priority label per issue
- Include at least one technical area label
- Add workflow state labels as issues progress
- Use session management labels for development coordination

### Project Organization
- Assign every issue to one of the 6 main projects
- Use projects as high-level epic organization
- Keep project descriptions up-to-date with current scope

### Comment Best Practices
- Add progress updates as comments
- Document decisions and rationale
- Link to code commits and branches
- Use Markdown formatting for code snippets and links

## Integration with Development Workflow

### Creating Issues During Development
When encountering bugs or needing to track work:
```
mcp__linear__create_issue(
  title: "Fix component validation in import system",
  team: "PipeTrak",
  description: "## Issue\nValidation fails for components with...\n\n## Expected Behavior\n...\n\n## Current Behavior\n...",
  project: "Import/Export System",
  labels: ["Bug", "Priority: High", "Backend", "Action-Required"]
)
```

### Session Documentation
At the end of development sessions:
```
mcp__linear__create_issue(
  title: "Session Handoff: Drawing navigation tree optimization",
  team: "PipeTrak",
  description: "## Current State\n- Working on branch: feature/tree-optimization\n- Completed: Virtual scrolling implementation\n- Next: Performance testing and edge case handling\n\n## Blockers\n- Need to investigate memory leak in large tree renders\n\n## Notes\n- Performance baseline established\n- Test data prepared in test-data.json",
  project: "Drawing Navigation",
  labels: ["Session-Handoff", "Next-Session", "Frontend", "Performance"]
)
```

This comprehensive guide ensures consistent and effective use of Linear for project management, bug tracking, and knowledge documentation in the PipeTrak project.