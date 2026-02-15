---
name: learning-plan
description: Create and manage executable learning plans with task tracking, progress monitoring, and dependency management for any subject
---

# Learning Plan Skill

## Overview

Create **executable, trackable learning plans** for any topic - programming languages, frameworks, soft skills, or academic subjects. Transform static documentation into an interactive learning system with task dependencies, progress tracking, and automated recommendations.

**Key Features:**
- 🎯 **Task Dependencies**: Automatically manages prerequisite tasks
- 📊 **Progress Tracking**: Real-time visualization of completion status  
- ⏱️ **Time Tracking**: Automatic study time logging
- 🚀 **Smart Recommendations**: Suggests next tasks based on dependencies
- 📈 **Statistics**: Learning analytics and completion forecasts
- 🔄 **Reusable**: Apply to any learning domain

**Announce at start:** "I'm using the learning-plan skill to create/manage your learning plan."

## When to Use

**Use this skill when:**
- Creating a structured learning plan for any topic
- Managing a complex multi-week learning journey
- Tracking progress through a curriculum
- Need dependency management between learning tasks
- Want automated progress reporting

**Examples:**
- "Create a 6-week plan to learn React"
- "Set up a Python learning path with daily tasks"
- "Track my progress through a Machine Learning course"
- "Manage a certification study schedule"

## Workflow

### Phase 1: Initialize Learning Plan

**Command:** `learning-plan init`

**Interactive prompts:**
1. **Learning Subject**: What do you want to learn?
2. **Duration**: How many weeks? (default: 4)
3. **Level**: Current skill level (beginner/intermediate/advanced)
4. **Goals**: What should they achieve by the end?
5. **Output Directory**: Where to create the plan? (default: ./learning-plan)

**Generated Structure:**
```
learning-plan/
├── 📖 learning-plan.md      # Main plan document
├── 📊 data/
│   └── progress.json        # Progress tracking data
├── ⚡ scripts/
│   ├── task-manager.js      # Task management CLI
│   └── launch.sh            # Interactive launcher
├── 📝 progress.md           # Manual progress log template
├── 📚 notes.md              # Study notes template
└── ❓ questions.md          # Q&A template
```

### Phase 2: Define Learning Tasks

**Structure tasks with dependencies:**

```yaml
# Example: OpenCode Learning Plan
tasks:
  1.1:  # Task ID format: <stage>.<sequence>
    name: "Read OpenCode documentation"
    stage: 1                    # Learning stage/phase
    week: 1                     # Which week
    day: 1                      # Which day
    duration: "2h"             # Estimated time
    deps: []                   # Prerequisites (task IDs)
    
  1.2:
    name: "Master basic tools"
    stage: 1
    week: 1
    day: 2
    duration: "2h"
    deps: ["1.1"]              # Requires 1.1 to be completed
```

**Task Granularity:**
- Each task should be completable in 1-3 hours
- Tasks should have clear success criteria
- Dependencies create a logical learning flow

### Phase 3: Execute Learning Plan

**Commands available:**

```bash
# List all tasks with status
node scripts/task-manager.js list

# List today's recommended tasks
node scripts/task-manager.js list --today

# Start a task (checks dependencies)
node scripts/task-manager.js start <task-id>

# Complete a task (logs time)
node scripts/task-manager.js complete <task-id>

# View progress dashboard
node scripts/task-manager.js progress

# See recommended next tasks
node scripts/task-manager.js next

# View learning statistics
node scripts/task-manager.js stats
```

**Interactive Mode:**
```bash
./scripts/launch.sh
# Shows menu:
# 1) 📖 Start Learning
# 2) 📋 View Today's Tasks
# 3) 📊 View Progress
# 4) 📝 Open Notes
# 5) ❓ Help
# 6) 🚪 Exit
```

## Plan Document Template

**Every learning plan MUST include:**

```markdown
# [Subject] Learning Plan

> 🎯 **Goal**: [Clear statement of what will be achieved]
> 📅 **Duration**: [X weeks]
> 👤 **Level**: [Current skill level]
> 📍 **Created**: [Date]

---

## 📊 Learning Overview

[Visual roadmap showing stages and progression]

---

## 🎯 Learning Objectives

By the end of this plan, you will be able to:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

---

## 📚 Stage 1: [Stage Name] (Weeks 1-2)

### Week 1: [Week Theme]

#### Day 1: [Daily Focus]
- [ ] **Task 1.1**: [Task name]
  - Duration: X hours
  - Resources: [Links/materials]
  - Success Criteria: [How to know it's done]

#### Day 2: [Daily Focus]
- [ ] **Task 1.2**: [Task name]
  - Dependencies: 1.1
  - Duration: X hours
  - Resources: [Links/materials]

---

## 📈 Progress Tracking

Run these commands to track progress:
```bash
node scripts/task-manager.js progress    # View overall progress
node scripts/task-manager.js stats       # View statistics
node scripts/task-manager.js next        # See next recommended tasks
```

---

## 📝 Daily Checklist

Each study session:
- [ ] Today's goal is clear
- [ ] Started task with: `node scripts/task-manager.js start <id>`
- [ ] Used appropriate learning resources
- [ ] Completed task with: `node scripts/task-manager.js complete <id>`
- [ ] Updated progress.md with learnings
- [ ] Noted questions in questions.md

---

## 🎓 Success Metrics

**Plan is complete when:**
- [ ] All tasks marked complete
- [ ] Can demonstrate key skills
- [ ] Completed final project/assessment
- [ ] Self-assessment shows competency

---

## 📞 Getting Help

When stuck:
1. Review task resources
2. Check questions.md for similar issues
3. Consult relevant documentation
4. Update progress.md with specific blockers
```

## Best Practices

### Task Design

**Good Tasks:**
```yaml
name: "Implement user authentication"
duration: "3h"
deps: ["2.1", "2.2"]  # After learning basics
success_criteria: "Login form works with validation"
```

**Bad Tasks:**
```yaml
name: "Learn JavaScript"  # Too vague
duration: "1 week"        # Too long
deps: []                  # No context
success_criteria: none    # Can't verify
```

### Dependency Management

**Linear Progression:**
```
1.1 → 1.2 → 1.3 → 2.1 → 2.2
```

**Branching (Parallel tracks):**
```
1.1 → 1.2 ─┬→ 2.1 (Theory)
           └→ 2.2 (Practice)
```

**Complex Projects:**
```
3.1 ─┬→ 4.1 ─┐
3.2 ─┘       ├→ 5.1 (Integration)
3.3 ─────────┘
```

### Progress Monitoring

**Weekly Review (5 minutes):**
```bash
node scripts/task-manager.js stats
# Check: completion rate, study time, consistency
```

**Daily Start (2 minutes):**
```bash
node scripts/task-manager.js next
# Shows what you can start today
```

**Daily End (2 minutes):**
```bash
node scripts/task-manager.js progress
# Update notes, mark completed tasks
```

## Integration with Other Skills

**Combine with:**
- `brainstorming` - Design learning approach
- `writing-plans` - Structure complex learning projects
- `systematic-debugging` - When stuck on difficult concepts
- `subagent-driven-development` - For hands-on coding tasks

## Examples

### Example 1: Python Learning (6 weeks)

```bash
# Initialize
learning-plan init
# Subject: Python Programming
# Duration: 6 weeks
# Level: Beginner
# Goal: Build a web scraper and API

# Generated plan includes:
# - Week 1-2: Syntax and basics
# - Week 3-4: Functions and OOP
# - Week 5: Libraries and tools
# - Week 6: Final project
```

### Example 2: Certification Prep (4 weeks)

```bash
learning-plan init
# Subject: AWS Solutions Architect
# Duration: 4 weeks
# Level: Intermediate
# Goal: Pass certification exam

# Generated plan includes:
# - Week 1: Core services
# - Week 2: Architecture patterns
# - Week 3: Practice exams
# - Week 4: Review and exam
```

### Example 3: Skill Mastery (Ongoing)

```bash
learning-plan init
# Subject: UI/UX Design
# Duration: 12 weeks
# Level: Advanced
# Goal: Build portfolio

# Generated plan includes:
# - Month 1: Theory and principles
# - Month 2: Tools mastery
# - Month 3: Portfolio projects
```

## Troubleshooting

### Task Dependencies Not Working
- Check task IDs are correct
- Ensure no circular dependencies
- Verify JSON syntax in progress.json

### Progress Not Saving
- Check file permissions in data/ directory
- Ensure disk space available
- Verify Node.js version (14+)

### Stats Seem Incorrect
- Check that `start` and `complete` are both called
- Verify system time is correct
- Review activity.log for errors

## Remember

- **Start small**: First plan should be 2-4 weeks
- **Be specific**: Vague tasks lead to abandonment
- **Track honestly**: Accurate data = better insights
- **Adjust as needed**: Plans are living documents
- **Celebrate wins**: Mark milestones completed

---

**After creating a plan:**
1. Review the generated learning-plan.md
2. Customize tasks to your specific needs
3. Run `./scripts/launch.sh` to begin
4. Start with Task 1.1

**Plan management:**
- Update tasks as you learn more
- Add resources as you find them
- Adjust durations based on reality
- Expand plan when reaching milestones
