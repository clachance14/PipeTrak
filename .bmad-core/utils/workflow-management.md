# Workflow Management Utilities

## Purpose
Utilities and guidelines for managing BMad Method workflows effectively.

## Workflow State Management

### State Tracking
- **Active Agent**: Which agent is currently active
- **Current Task**: What task is being executed
- **Progress**: How far through the workflow we are
- **Dependencies**: What dependencies are loaded or needed
- **Context**: Current project and story context

### State Transitions
- **Agent Switching**: Moving between different agent personas
- **Task Progression**: Moving through tasks within a workflow
- **Handoffs**: Passing work between agents
- **Context Preservation**: Maintaining context across transitions

## Common Workflow Patterns

### Sequential Workflow
```
PO: Requirements → Story Creation → Validation
  ↓
Dev: Technical Planning → Implementation → Testing
  ↓
PO: Review → Acceptance → Deployment Authorization
```

### Collaborative Workflow  
```
PO + Dev: Joint planning session
  ↓
PO: Requirements refinement ←→ Dev: Technical feasibility
  ↓
PO: Final validation ←→ Dev: Implementation readiness
```

### Iterative Workflow
```
PO: Story creation → Dev: Implementation → Review
  ↓                                        ↑
  └── Refinement needed ←──────────────────┘
```

## Workflow Management Commands

### Status Commands
- `*status` - Show current workflow state
- `*plan-status` - Show workflow plan progress
- `*agent-status` - Show current agent and capabilities

### Navigation Commands
- `*agent [name]` - Switch to different agent
- `*task [name]` - Execute specific task
- `*workflow [name]` - Start specific workflow

### Control Commands
- `*yolo` - Toggle skip confirmations mode
- `*party-mode` - Enable multi-agent collaboration
- `*exit` - Exit current agent or workflow

## Error Handling

### Common Issues
- **Missing Dependencies**: Agent needs file that doesn't exist
- **Ambiguous Requirements**: Story or task requirements unclear
- **Technical Blockers**: Implementation cannot proceed
- **Process Violations**: Workflow rules not followed

### Resolution Patterns
- **Escalation**: Move issue to appropriate agent
- **Clarification**: Request additional information
- **Alternative Approach**: Try different implementation path
- **Process Reset**: Return to earlier workflow stage

## Quality Gates

### Entry Criteria
- All required information available
- Dependencies resolved
- Agent capabilities match task requirements
- Context properly established

### Exit Criteria
- Task objectives met
- Quality standards satisfied
- Documentation complete
- Handoff information prepared

## Performance Optimization

### Context Management
- Load only necessary files
- Preserve context between tasks
- Minimize redundant operations
- Clean up unused resources

### Workflow Efficiency
- Batch similar operations
- Minimize agent switching
- Prepare handoff information
- Document decisions for reuse

## Collaboration Patterns

### Handoff Management
- Clear handoff criteria
- Complete information transfer
- Status documentation
- Context preservation

### Multi-Agent Coordination
- Clear role boundaries
- Shared context management
- Decision point coordination
- Conflict resolution procedures

## Monitoring and Metrics

### Workflow Metrics
- Task completion time
- Agent switching frequency
- Error rate and resolution time
- Quality gate pass rate

### Quality Metrics
- Requirements completeness
- Implementation quality
- Documentation quality
- Stakeholder satisfaction

## Best Practices

### Planning
- Define clear objectives
- Identify dependencies early
- Plan for likely issues
- Prepare rollback procedures

### Execution
- Follow defined processes
- Document decisions and changes
- Communicate status regularly
- Maintain quality standards

### Review
- Validate against objectives
- Assess process effectiveness
- Identify improvement opportunities
- Update workflows as needed

---

*These utilities should be referenced when managing complex workflows or when issues arise during execution.*