# Learning Plan Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode Skill](https://img.shields.io/badge/OpenCode-Skill-blue.svg)]()

> Transform any learning goal into an executable, trackable plan with task dependencies, progress monitoring, and smart recommendations.

**English** | [中文](README.zh.md)

---

## 🌟 Features

- 📋 **Task Dependency Management** - Automatically controls prerequisite tasks
- 📊 **Visual Progress Tracking** - Real-time dashboard with progress bars
- ⏱️ **Time Logging** - Automatic study time tracking
- 🎯 **Smart Recommendations** - Suggests next tasks based on dependencies
- 📈 **Learning Statistics** - Analytics, streaks, and completion forecasts
- 🔄 **Multi-Plan Support** - Manage multiple learning plans simultaneously
- 🎨 **Interactive CLI** - Beautiful terminal interface with colors
- 📱 **Zero Config** - Works out of the box

---

## 📦 Installation

### Option 1: One-Command Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/learning-plan-skill/main/install.sh | bash
```

### Option 2: Manual Installation

```bash
# Clone or download the skill
git clone https://github.com/yourusername/learning-plan-skill.git
cd learning-plan-skill

# Install
./install.sh
```

### Option 3: Direct Copy

```bash
# Create skill directory
mkdir -p ~/.config/opencode/skills/learning-plan

# Copy files
cp -r templates/* ~/.config/opencode/skills/learning-plan/
chmod +x ~/.config/opencode/skills/learning-plan/templates/task-manager.js
```

---

## 🚀 Quick Start

### 1. Create Your First Learning Plan

```bash
# Create a directory for your learning plan
mkdir ~/learn-python
cd ~/learn-python

# Copy the skill templates
cp -r ~/.config/opencode/skills/learning-plan/templates/* .

# Edit the plan configuration
vim data/config.json
```

### 2. Define Your Learning Tasks

Edit `data/config.json`:

```json
{
  "name": "Python Programming",
  "description": "Master Python from basics to advanced",
  "duration": "6 weeks",
  "level": "beginner",
  "tasks": {
    "1.1": {
      "name": "Setup Python environment",
      "stage": 1,
      "week": 1,
      "day": 1,
      "duration": "1h",
      "deps": []
    },
    "1.2": {
      "name": "Learn variables and data types",
      "stage": 1,
      "week": 1,
      "day": 2,
      "duration": "2h",
      "deps": ["1.1"]
    },
    "1.3": {
      "name": "Control flow (if/else, loops)",
      "stage": 1,
      "week": 1,
      "day": 3,
      "duration": "2h",
      "deps": ["1.2"]
    }
  }
}
```

### 3. Start Learning

```bash
# List all tasks
node scripts/task-manager.js list

# Start your first task
node scripts/task-manager.js start 1.1

# After studying...
node scripts/task-manager.js complete 1.1

# Check progress
node scripts/task-manager.js progress
```

---

## 📖 Usage Guide

### Task Manager Commands

#### `list` - List All Tasks

```bash
node scripts/task-manager.js list
```

**Output:**
```
📋 Python Programming Tasks
======================================================================

🎯 Stage 1
----------------------------------------------------------------------
⏳ [1.1] Setup Python environment
   Week 1, Day 1 | 1h | Deps: none

🔒 [1.2] Learn variables and data types
   Week 1, Day 2 | 2h | Deps: 1.1

🔒 [1.3] Control flow
   Week 1, Day 3 | 2h | Deps: 1.2
```

**Status Icons:**
- ⏳ Available (dependencies met)
- 🔒 Locked (dependencies not met)
- 🔄 In Progress
- ✅ Completed

#### `start` - Start a Task

```bash
node scripts/task-manager.js start <task-id>
```

**Example:**
```bash
node scripts/task-manager.js start 1.2
```

**Features:**
- Automatically checks dependencies
- Records start time
- Updates task status
- Shows next recommended tasks

#### `complete` - Complete a Task

```bash
node scripts/task-manager.js complete <task-id>
```

**Example:**
```bash
node scripts/task-manager.js complete 1.2
```

**Features:**
- Calculates study duration
- Updates progress statistics
- Unlocks dependent tasks
- Shows completion milestone

#### `progress` - View Progress Dashboard

```bash
node scripts/task-manager.js progress
```

**Output:**
```
📊 Learning Progress Dashboard
============================================================

Overall Progress: 35%
[████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 35%

✅ Completed: 7/20 tasks
🔄 In Progress: 0 tasks
⏳ Remaining: 13 tasks

Stage Breakdown:
Stage 1: [████████████████████░░░░░░░░░░░░░░░░░░] 40% (2/5)
Stage 2: [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 25% (1/4)
Stage 3: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% (0/4)

📅 Started: 2/14/2026
⏱️  Total Study Time: 12.5 hours
🔥 Current Streak: 3 days!
```

#### `next` - Recommended Next Tasks

```bash
node scripts/task-manager.js next
```

**Output:**
```
📌 Recommended Next Steps:

1. [1.3] Control flow
   Stage 1, Week 1 | 2h

2. [1.4] Functions
   Stage 1, Week 2 | 3h

Run: node scripts/task-manager.js start <task-id> to begin
```

#### `stats` - Learning Statistics

```bash
node scripts/task-manager.js stats
```

**Output:**
```
📈 Learning Statistics
============================================================

📅 Study Days: 8
📊 Average Daily: 1.6 hours

Last 7 Days:
  Feb 14: ████████░░░░░░░░░░░░ 2h
  Feb 13: ████░░░░░░░░░░░░░░░░ 1h
  Feb 12: ████████░░░░░░░░░░░░ 2h
  ...

🎯 Completion Projection:
  Remaining Tasks: 13
  Estimated Hours: 26
  At Current Pace: 16 days
  
🔥 Current Streak: 3 days!
```

---

## 📁 Configuration

### Task Configuration Format

```json
{
  "<stage>.<sequence>": {
    "name": "Task name",
    "stage": 1,              // Learning stage
    "week": 1,               // Week number
    "day": 1,                // Day number
    "duration": "2h",        // Estimated time
    "deps": ["1.1"]          // Prerequisite task IDs
  }
}
```

### Dependency Patterns

**Linear Progression:**
```json
"1.1": { "deps": [] }
"1.2": { "deps": ["1.1"] }
"1.3": { "deps": ["1.2"] }
```

**Parallel Tracks:**
```json
"2.1": { "deps": ["1.3"] }  // Theory
"2.2": { "deps": ["1.3"] }  // Practice
```

**Complex Dependencies:**
```json
"3.1": { "deps": ["2.1", "2.2"] }  // Requires both tracks
```

---

## 🎨 Interactive Launcher

Use the interactive menu for easier navigation:

```bash
./scripts/launch.sh
```

**Menu Options:**
1. 📖 Start Learning
2. 📋 View Today's Tasks
3. 📊 View Progress
4. 📝 Open Notes
5. ❓ Help
6. 🚪 Exit

---

## 📊 Data Storage

All data is stored locally in JSON format:

```
learning-plan/
├── data/
│   ├── config.json          # Task definitions
│   └── progress.json        # Progress & statistics
│       ├── startDate
│       ├── tasks
│       ├── dailyLog
│       ├── totalStudyTime
│       └── currentTask
```

---

## 🔧 Advanced Usage

### Multiple Learning Plans

Create multiple independent plans:

```bash
# Python plan
mkdir ~/learn-python && cd ~/learn-python
cp -r ~/.config/opencode/skills/learning-plan/templates/* .
# Edit data/config.json for Python

# React plan
mkdir ~/learn-react && cd ~/learn-react
cp -r ~/.config/opencode/skills/learning-plan/templates/* .
# Edit data/config.json for React

# Both plans are completely independent
```

### Custom Task Duration Format

```json
"duration": "30m"    // 30 minutes
"duration": "2h"     // 2 hours
"duration": "1.5h"   // 1.5 hours
"duration": "3h30m"  // 3 hours 30 minutes
```

### Integration with Assessment Skill

Combine with assessment skill for personalized plans:

```bash
# 1. Assess current level
assessment init
assessment start
assessment generate-plan

# 2. Use generated plan
cp learning-plan.json ~/my-learning/data/config.json
cd ~/my-learning
node scripts/task-manager.js list
```

---

## 🎯 Best Practices

### Task Design

**✅ Good Tasks:**
- Specific and actionable
- 1-3 hours duration
- Clear success criteria
- Logical dependencies

**Example:**
```json
{
  "name": "Implement user authentication with JWT",
  "duration": "3h",
  "deps": ["2.1", "2.2"]
}
```

**❌ Bad Tasks:**
- Vague or too broad
- Too long (> 4 hours)
- No clear completion criteria

### Daily Workflow

**Morning (2 minutes):**
```bash
node scripts/task-manager.js next
node scripts/task-manager.js start <task-id>
```

**Evening (2 minutes):**
```bash
node scripts/task-manager.js complete <task-id>
node scripts/task-manager.js progress
```

**Weekly (5 minutes):**
```bash
node scripts/task-manager.js stats
# Review and adjust plan if needed
```

---

## 🐛 Troubleshooting

### Task Not Found

**Error:** `Task X.X not found`

**Solution:**
```bash
# Check config.json syntax
cat data/config.json | python -m json.tool

# Verify task ID format (should be like "1.1", "2.3")
```

### Dependencies Not Working

**Error:** `Prerequisites not met`

**Solution:**
```bash
# List tasks to see dependencies
node scripts/task-manager.js list

# Complete prerequisite tasks first
node scripts/task-manager.js complete <prereq-id>
```

### Progress Not Saving

**Solution:**
```bash
# Check file permissions
ls -la data/

# Ensure data directory exists
mkdir -p data

# Check disk space
df -h
```

---

## 🤝 Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **assessment** | Generate personalized plans from skill gaps |
| **brainstorming** | Design learning approach |
| **writing-plans** | Structure complex learning projects |
| **systematic-debugging** | When stuck on difficult concepts |

---

## 📝 Examples

### Example 1: Python Programming (6 weeks)

```json
{
  "name": "Python Programming",
  "tasks": {
    "1.1": { "name": "Python setup", "duration": "1h", "deps": [] },
    "1.2": { "name": "Variables and types", "duration": "2h", "deps": ["1.1"] },
    "1.3": { "name": "Control flow", "duration": "2h", "deps": ["1.2"] },
    "1.4": { "name": "Functions", "duration": "3h", "deps": ["1.3"] },
    "1.5": { "name": "Project: Calculator", "duration": "4h", "deps": ["1.4"] },
    "2.1": { "name": "Lists and dictionaries", "duration": "3h", "deps": ["1.5"] },
    "2.2": { "name": "File I/O", "duration": "2h", "deps": ["2.1"] },
    "2.3": { "name": "Error handling", "duration": "2h", "deps": ["2.2"] },
    "2.4": { "name": "Project: Todo app", "duration": "5h", "deps": ["2.3"] },
    "3.1": { "name": "OOP basics", "duration": "4h", "deps": ["2.4"] },
    "3.2": { "name": "Classes and objects", "duration": "4h", "deps": ["3.1"] },
    "3.3": { "name": "Inheritance", "duration": "3h", "deps": ["3.2"] },
    "3.4": { "name": "Final project", "duration": "8h", "deps": ["3.3"] }
  }
}
```

### Example 2: AWS Certification (4 weeks)

```json
{
  "name": "AWS Solutions Architect",
  "tasks": {
    "1.1": { "name": "EC2 fundamentals", "duration": "3h", "deps": [] },
    "1.2": { "name": "S3 and storage", "duration": "2h", "deps": ["1.1"] },
    "1.3": { "name": "VPC and networking", "duration": "4h", "deps": ["1.2"] },
    "2.1": { "name": "RDS and databases", "duration": "3h", "deps": ["1.3"] },
    "2.2": { "name": "Lambda and serverless", "duration": "3h", "deps": ["2.1"] },
    "3.1": { "name": "Architecture patterns", "duration": "4h", "deps": ["2.2"] },
    "3.2": { "name": "Practice exam 1", "duration": "3h", "deps": ["3.1"] },
    "3.3": { "name": "Practice exam 2", "duration": "3h", "deps": ["3.2"] },
    "4.1": { "name": "Review weak areas", "duration": "4h", "deps": ["3.3"] },
    "4.2": { "name": "Final practice", "duration": "3h", "deps": ["4.1"] }
  }
}
```

---

## 🛣️ Roadmap

- [ ] Web dashboard for visual progress
- [ ] Calendar integration
- [ ] Mobile app
- [ ] Team/enterprise features
- [ ] AI-powered task recommendations
- [ ] Integration with learning platforms

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

### Areas for Contribution

- Additional task templates
- Visualization features
- Export options (PDF, CSV)
- New language translations
- Documentation improvements

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenCode community for the skill framework
- Contributors and testers
- Inspiration from various learning methodologies

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/learning-plan-skill/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/learning-plan-skill/discussions)
- **Email:** your.email@example.com

---

**Happy Learning!** 🎓✨

[⬆ Back to Top](#learning-plan-skill)
