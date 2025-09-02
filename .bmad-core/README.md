# BMad Core Integration Guide

## Overview
This directory contains the core BMad Method framework resources for the PipeTrak project. The BMad Method uses a **dual-agent system** that combines methodology-focused agents with project-specific specialists.

## Agent Systems Architecture

### 🎭 **BMad Core Agents** (Slash Commands)
**Location**: `.claude/commands/`  
**Invocation**: Use slash commands  
**Purpose**: Core BMad methodology agents for general development workflow

| Agent | Command | Description |
|-------|---------|-------------|
| **Sarah (PO)** | `/po` | Product Owner for backlog management, story refinement, acceptance criteria |
| **James (Dev)** | `/dev` | Full Stack Developer for implementation, debugging, testing |
| **BMad Orchestrator** | `/bmad-orchestrator` | Workflow coordination and agent management |

### 🔧 **PipeTrak Specialized Agents** (Task Tool)
**Location**: `.claude/agents/`  
**Invocation**: Use Task tool with `subagent_type` parameter  
**Purpose**: Domain-specific agents for specialized PipeTrak development tasks

| Agent | Specialization | When to Use |
|-------|---------------|-------------|
| **pipetrak-architect** | System architecture, technical blueprints | Designing database schemas, API contracts |
| **pipetrak-backend-engineer** | Supabase implementation | Database migrations, RPC functions, RLS policies |
| **pipetrak-frontend-engineer** | React components, UI | Building components, real-time features |
| **pipetrak-ux-lead** | Design specifications | Creating design specs, component specifications |
| **pipetrak-pm-spec-writer** | Requirements specification | Converting ideas to testable specifications |
| **pipetrak-qa-automation** | Test planning, automation | Creating test plans, writing tests |
| **pipetrak-debug-specialist** | Error diagnosis, troubleshooting | Debugging issues, error resolution |
| **pipetrak-deployment-orchestrator** | Build orchestration | Phased build planning, deployment |
| **pipetrak-ux-judge** | UI quality evaluation | Evaluating interfaces for field usability |
| **devops-deployment-engineer** | Infrastructure, CI/CD | Containerization, deployment infrastructure |
| **security-analyst** | Security analysis | Vulnerability assessment, compliance |

## When to Use Which System

### Use Slash Commands When:
- Starting a new development session
- General product ownership tasks
- Standard development workflows
- Story creation and management
- Cross-cutting concerns that span multiple domains

### Use Task Tool Agents When:
- Specialized technical implementation
- Domain-specific architecture decisions
- Complex debugging or troubleshooting
- Quality assurance activities
- Security or performance analysis
- Deployment and infrastructure work

## Quick Start Examples

### Starting a Development Session
```
/bmad-orchestrator
*party-mode              # Enable multi-agent collaboration
```

### Creating a New Story
```
/po
*create-story            # Use BMad methodology for story creation
```

### Implementing a Story
```
/dev
*develop-story           # Use BMad development workflow
```

### Specialized Implementation
```
# For backend work
Task with subagent_type: pipetrak-backend-engineer

# For frontend work  
Task with subagent_type: pipetrak-frontend-engineer

# For architecture decisions
Task with subagent_type: pipetrak-architect
```

## Resource Structure

```
.bmad-core/
├── README.md           # This integration guide
├── core-config.yaml    # Configuration for both agent systems
├── tasks/              # Reusable task workflows
│   ├── create-story.md
│   ├── develop-story.md
│   ├── execute-checklist.md
│   └── validate-next-story.md
├── templates/          # Document templates
│   ├── story-tmpl.yaml
│   └── prd-tmpl.md
├── checklists/         # Process checklists
│   ├── po-master-checklist.md
│   └── story-dod-checklist.md
├── data/               # Knowledge base and context
│   ├── bmad-kb.md
│   └── pipetrak-context.md
└── utils/              # Utility functions and helpers
    └── workflow-management.md
```

## Agent Collaboration Patterns

### Sequential Workflow
```
/po → Story Creation → /dev → Implementation → /po → Review
```

### Collaborative Workflow
```
/bmad-orchestrator
*party-mode
# Multiple agents work together on complex decisions
```

### Specialized Deep Dive
```
/po → Requirements → Task(pipetrak-architect) → Task(pipetrak-frontend-engineer) → /dev → Integration
```

## Common Commands Reference

### BMad Core Commands (Slash Commands)
- `/po` - Activate Product Owner persona
- `/dev` - Activate Developer persona  
- `/bmad-orchestrator` - Activate orchestrator for coordination
- `*help` - Show available commands for current agent
- `*party-mode` - Enable multi-agent collaboration
- `*create-story` - Create new user story (PO)
- `*develop-story` - Implement story (Dev)

### Task Tool Integration
- Use Task tool with appropriate `subagent_type` for specialized work
- Reference `.claude/agents/` directory for available specialists
- Each specialist has specific expertise areas and capabilities

## Configuration and Standards

All development standards, coding conventions, and project-specific configurations are defined in `core-config.yaml`. This includes:

- **Technology Stack**: Next.js, React, TypeScript, Supabase, etc.
- **Coding Standards**: TypeScript patterns, React conventions, performance guidelines
- **Quality Standards**: Testing requirements, accessibility, security
- **PipeTrak Patterns**: Mobile-first design, field usability, data patterns

## Best Practices

1. **Start with Slash Commands** for general workflow and story management
2. **Use Task Tool Agents** for specialized technical implementation
3. **Reference Resources** in `.bmad-core/` for templates and checklists
4. **Follow Quality Gates** defined in checklists and core configuration
5. **Document Decisions** in stories and maintain change logs

## Troubleshooting

### Agent Not Working?
- Check if using correct invocation method (slash command vs Task tool)
- Verify agent files exist in expected locations
- Ensure proper parameters for Task tool invocations

### Resource Not Found?
- Check `.bmad-core/` directory for templates and resources
- Verify paths in `core-config.yaml` are correct
- Ensure required files exist and are properly formatted

### Workflow Issues?
- Review workflow patterns in this guide
- Check agent capabilities in `core-config.yaml`
- Use `*help` command for available options

---

*This dual-system approach provides both methodological consistency (BMad Core) and domain expertise (PipeTrak Specialists) for optimal development workflow.*