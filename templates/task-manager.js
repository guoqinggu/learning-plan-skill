#!/usr/bin/env node
/**
 * Universal Learning Plan Task Manager
 * Works with any learning plan created by the learning-plan skill
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'progress.json');
const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.json');

// ANSI color codes
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function color(name, text) {
  return `${COLORS[name] || ''}${text}${COLORS.reset}`;
}

// Load tasks from config
function loadTasks() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(color('red', 'Error: No learning plan found in current directory'));
    console.log(color('cyan', 'Run this command from a learning plan directory'));
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  return config.tasks || {};
}

// Initialize data file
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const initialData = {
      startDate: new Date().toISOString(),
      tasks: {},
      dailyLog: {},
      totalStudyTime: 0,
      currentTask: null,
      lastStudyDate: null
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  initData();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Check if dependencies are met
function checkDeps(taskId, data, tasks) {
  const task = tasks[taskId];
  if (!task || !task.deps || task.deps.length === 0) return true;
  
  return task.deps.every(depId => {
    return data.tasks[depId] && data.tasks[depId].status === 'completed';
  });
}

// Get available tasks
function getAvailableTasks(data, tasks) {
  return Object.keys(tasks).filter(taskId => {
    const task = data.tasks[taskId];
    return !task || task.status !== 'completed';
  }).filter(taskId => checkDeps(taskId, data, tasks));
}

// Progress bar
function progressBar(percentage, width = 40) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return color('green', '█'.repeat(filled)) + color('gray', '░'.repeat(empty));
}

// List all tasks
function listTasks(today = false, tasks) {
  const data = readData();
  tasks = tasks || loadTasks();
  
  console.log(color('bold', '\n📋 Learning Plan Tasks\n'));
  console.log('=' .repeat(70));
  
  let currentStage = 0;
  let hasShownToday = false;
  
  Object.entries(tasks).forEach(([taskId, task]) => {
    if (today) {
      // Show only available tasks
      if (!checkDeps(taskId, data, tasks)) return;
      if (data.tasks[taskId]?.status === 'completed') return;
    }
    
    if (task.stage !== currentStage) {
      currentStage = task.stage;
      console.log(color('cyan', `\n🎯 Stage ${currentStage}`));
      console.log('-'.repeat(70));
    }
    
    const taskData = data.tasks[taskId] || {};
    let status;
    if (taskData.status === 'completed') {
      status = color('green', '✅');
    } else if (taskData.status === 'in_progress') {
      status = color('yellow', '🔄');
    } else if (checkDeps(taskId, data, tasks)) {
      status = color('blue', '⏳');
    } else {
      status = color('red', '🔒');
    }
    
    console.log(`${status} [${color('bold', taskId)}] ${task.name}`);
    console.log(`   Week ${task.week}, Day ${task.day} | ${color('yellow', task.duration)} | Deps: ${task.deps.join(', ') || 'none'}`);
    
    if (taskData.completedAt) {
      const completedDate = new Date(taskData.completedAt).toLocaleDateString();
      console.log(`   ${color('green', '✓')} Completed: ${completedDate}`);
    }
    console.log();
  });
  
  if (today) {
    const available = getAvailableTasks(data, tasks);
    console.log(color('cyan', `\n📌 You have ${available.length} task(s) ready to start`));
  }
}

// Start a task
function startTask(taskId, tasks) {
  const data = readData();
  tasks = tasks || loadTasks();
  
  if (!tasks[taskId]) {
    console.error(color('red', `❌ Task ${taskId} not found`));
    return;
  }
  
  if (!checkDeps(taskId, data, tasks)) {
    console.error(color('red', `❌ Prerequisites not met for task ${taskId}`));
    console.log(color('yellow', '\nComplete these tasks first:'));
    tasks[taskId].deps.forEach(depId => {
      if (!data.tasks[depId] || data.tasks[depId].status !== 'completed') {
        console.log(`  🔒 ${depId}: ${tasks[depId]?.name || 'Unknown'}`);
      }
    });
    return;
  }
  
  // Update current task if one was in progress
  if (data.currentTask && data.currentTask !== taskId) {
    console.log(color('yellow', `\n⚠️  Previous task "${data.currentTask}" was in progress`));
    console.log(color('cyan', 'Marking it as paused\n'));
  }
  
  data.tasks[taskId] = {
    ...data.tasks[taskId],
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  data.currentTask = taskId;
  
  // Update daily log
  const today = new Date().toISOString().split('T')[0];
  if (!data.dailyLog[today]) {
    data.dailyLog[today] = { tasksStarted: [], tasksCompleted: [], minutes: 0 };
  }
  data.dailyLog[today].tasksStarted.push(taskId);
  
  saveData(data);
  
  console.log(color('green', `\n🚀 Started Task: [${taskId}] ${tasks[taskId].name}`));
  console.log(color('cyan', `\nWhen finished, run:`));
  console.log(color('bold', `  node scripts/task-manager.js complete ${taskId}`));
  console.log();
}

// Complete a task
function completeTask(taskId, tasks) {
  const data = readData();
  tasks = tasks || loadTasks();
  
  if (!tasks[taskId]) {
    console.error(color('red', `❌ Task ${taskId} not found`));
    return;
  }
  
  const startTime = data.tasks[taskId]?.startedAt;
  const endTime = new Date().toISOString();
  let duration = 0;
  
  if (startTime) {
    duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000 / 60);
  }
  
  data.tasks[taskId] = {
    ...data.tasks[taskId],
    status: 'completed',
    completedAt: endTime,
    durationMinutes: duration
  };
  
  if (data.currentTask === taskId) {
    data.currentTask = null;
  }
  
  // Update statistics
  data.totalStudyTime += duration;
  
  // Update daily log
  const today = new Date().toISOString().split('T')[0];
  if (!data.dailyLog[today]) {
    data.dailyLog[today] = { tasksStarted: [], tasksCompleted: [], minutes: 0 };
  }
  data.dailyLog[today].tasksCompleted.push(taskId);
  data.dailyLog[today].minutes += duration;
  data.lastStudyDate = today;
  
  saveData(data);
  
  console.log(color('green', `\n✅ Task Completed: [${taskId}] ${tasks[taskId].name}`));
  if (duration > 0) {
    console.log(color('cyan', `⏱️  Time spent: ${duration} minutes`));
  }
  console.log(color('blue', `📊 Total study time: ${Math.round(data.totalStudyTime / 60 * 10) / 10} hours`));
  console.log();
  
  // Show celebration for milestones
  const completedCount = Object.values(data.tasks).filter(t => t.status === 'completed').length;
  if (completedCount === 1 || completedCount % 5 === 0) {
    console.log(color('magenta', `🎉 Milestone: ${completedCount} tasks completed!`));
  }
  
  showNextTasks(data, tasks);
}

// Show next recommended tasks
function showNextTasks(data, tasks) {
  tasks = tasks || loadTasks();
  const available = getAvailableTasks(data, tasks);
  
  if (available.length === 0) {
    console.log(color('green', '\n🎊 Congratulations! All tasks completed!'));
    console.log(color('cyan', 'You\'ve finished your learning plan!'));
    return;
  }
  
  console.log(color('bold', '\n📌 Recommended Next Steps:'));
  console.log();
  
  available.slice(0, 3).forEach((taskId, index) => {
    const task = tasks[taskId];
    console.log(`${index + 1}. [${color('bold', taskId)}] ${task.name}`);
    console.log(`   Stage ${task.stage}, Week ${task.week} | ${color('yellow', task.duration)}`);
    console.log();
  });
  
  console.log(color('cyan', `Run: node scripts/task-manager.js start <task-id> to begin`));
  console.log();
}

// Show progress dashboard
function showProgress(tasks) {
  const data = readData();
  tasks = tasks || loadTasks();
  
  const totalTasks = Object.keys(tasks).length;
  const completedTasks = Object.values(data.tasks).filter(t => t.status === 'completed').length;
  const inProgressTasks = Object.values(data.tasks).filter(t => t.status === 'in_progress').length;
  const progress = Math.round((completedTasks / totalTasks) * 100);
  
  console.log(color('bold', '\n📊 Learning Progress Dashboard\n'));
  console.log('='.repeat(60));
  console.log();
  console.log(`${color('bold', 'Overall Progress:')} ${color('green', progress + '%')}`);
  console.log(progressBar(progress, 50));
  console.log();
  console.log(`${color('green', '✅')} Completed: ${completedTasks}/${totalTasks} tasks`);
  console.log(`${color('yellow', '🔄')} In Progress: ${inProgressTasks} tasks`);
  console.log(`${color('blue', '⏳')} Remaining: ${totalTasks - completedTasks - inProgressTasks} tasks`);
  console.log();
  
  // Stage breakdown
  console.log(color('bold', 'Stage Breakdown:'));
  console.log();
  
  const stages = [...new Set(Object.values(tasks).map(t => t.stage))].sort();
  stages.forEach(stage => {
    const stageTasks = Object.entries(tasks).filter(([_, t]) => t.stage === stage);
    const stageCompleted = stageTasks.filter(([id, _]) => 
      data.tasks[id]?.status === 'completed'
    ).length;
    const stageProgress = Math.round((stageCompleted / stageTasks.length) * 100);
    const stageBar = progressBar(stageProgress, 30);
    console.log(`Stage ${stage}: ${stageBar} ${stageProgress}% (${stageCompleted}/${stageTasks.length})`);
  });
  
  console.log();
  console.log(`${color('cyan', '📅')} Started: ${new Date(data.startDate).toLocaleDateString()}`);
  console.log(`${color('magenta', '⏱️')}  Total Study Time: ${Math.round(data.totalStudyTime / 60 * 10) / 10} hours`);
  
  if (data.lastStudyDate) {
    const daysSince = Math.floor((new Date() - new Date(data.lastStudyDate)) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) {
      console.log(color('green', '🔥 Studying today! Keep it up!'));
    } else if (daysSince === 1) {
      console.log(color('yellow', '📚 Last studied yesterday'));
    } else {
      console.log(color('red', `⏰ Last studied ${daysSince} days ago`));
    }
  }
  console.log();
}

// Show statistics
function showStats(tasks) {
  const data = readData();
  tasks = tasks || loadTasks();
  
  console.log(color('bold', '\n📈 Learning Statistics\n'));
  console.log('='.repeat(60));
  console.log();
  
  // Basic stats
  const studyDays = Object.keys(data.dailyLog).length;
  const avgDaily = studyDays > 0 ? Math.round((data.totalStudyTime / studyDays / 60) * 10) / 10 : 0;
  
  console.log(`${color('cyan', '📅')} Study Days: ${color('bold', studyDays)}`);
  console.log(`${color('blue', '📊')} Average Daily: ${color('bold', avgDaily + ' hours')}`);
  console.log();
  
  // Recent activity (last 7 days)
  console.log(color('bold', 'Last 7 Days:'));
  console.log();
  
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();
  
  last7Days.forEach(date => {
    const dayData = data.dailyLog[date];
    const minutes = dayData ? dayData.minutes : 0;
    const hours = Math.round(minutes / 60 * 10) / 10;
    const barLength = Math.min(Math.round(hours * 2), 20);
    const bar = color('green', '█'.repeat(barLength)) + color('gray', '░'.repeat(20 - barLength));
    const dateLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    console.log(`  ${dateLabel}: ${bar} ${hours}h`);
  });
  
  console.log();
  
  // Projection
  const remainingTasks = Object.keys(tasks).length - 
    Object.values(data.tasks).filter(t => t.status === 'completed').length;
  const avgTaskTime = 120; // 2 hours in minutes
  const remainingMinutes = remainingTasks * avgTaskTime;
  const daysAtCurrentPace = avgDaily > 0 ? Math.ceil((remainingMinutes / 60) / avgDaily) : '∞';
  
  console.log(color('bold', '🎯 Completion Projection:'));
  console.log(`  Remaining Tasks: ${color('yellow', remainingTasks)}`);
  console.log(`  Estimated Hours: ${color('yellow', Math.round(remainingMinutes / 60))}`);
  console.log(`  At Current Pace: ${color('cyan', daysAtCurrentPace + ' days')}`);
  console.log();
  
  // Streak calculation
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(data.dailyLog).sort();
  
  if (sortedDates.includes(today) || sortedDates.includes(last7Days[5])) {
    streak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const current = new Date(sortedDates[i + 1]);
      const previous = new Date(sortedDates[i]);
      const diffDays = (current - previous) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  
  if (streak > 0) {
    console.log(color('magenta', `🔥 Current Streak: ${streak} day${streak > 1 ? 's' : ''}!`));
  }
  console.log();
}

// Initialize new learning plan
function initPlan() {
  console.log(color('bold', '\n🚀 Learning Plan Creator\n'));
  console.log('='.repeat(60));
  console.log();
  console.log(color('yellow', 'This will create a new learning plan in the current directory.'));
  console.log();
  console.log(color('cyan', 'To create a plan, provide these details:'));
  console.log();
  console.log('  1. Subject: What do you want to learn?');
  console.log('  2. Duration: How many weeks? (default: 4)');
  console.log('  3. Level: Your current skill level');
  console.log('  4. Goals: What you want to achieve');
  console.log();
  console.log(color('green', 'Example:'));
  console.log('  learning-plan init');
  console.log();
  console.log(color('cyan', 'Or use quick mode:'));
  console.log('  learning-plan init --subject "Python" --weeks 6 --level beginner');
  console.log();
}

// Main function
function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  // Load tasks for most commands
  let tasks = {};
  if (command !== 'init' && command !== '--help' && command !== '-h') {
    try {
      tasks = loadTasks();
    } catch (e) {
      // Error already printed
      process.exit(1);
    }
  }
  
  switch (command) {
    case 'list':
      listTasks(arg === '--today', tasks);
      break;
    case 'start':
      if (!arg) {
        console.error(color('red', 'Usage: node scripts/task-manager.js start <task-id>'));
        console.log(color('cyan', 'Example: node scripts/task-manager.js start 1.1'));
        process.exit(1);
      }
      startTask(arg, tasks);
      break;
    case 'complete':
      if (!arg) {
        console.error(color('red', 'Usage: node scripts/task-manager.js complete <task-id>'));
        process.exit(1);
      }
      completeTask(arg, tasks);
      break;
    case 'progress':
      showProgress(tasks);
      break;
    case 'next':
      showNextTasks(readData(), tasks);
      break;
    case 'stats':
      showStats(tasks);
      break;
    case 'init':
      initPlan();
      break;
    case '--help':
    case '-h':
    default:
      console.log(color('bold', '\n📚 Learning Plan Task Manager\n'));
      console.log('='.repeat(60));
      console.log();
      console.log('Usage: node scripts/task-manager.js <command> [options]');
      console.log();
      console.log(color('bold', 'Commands:'));
      console.log();
      console.log(`  ${color('cyan', 'list')}              List all tasks`);
      console.log(`  ${color('cyan', 'list --today')}      List tasks available to start today`);
      console.log(`  ${color('cyan', 'start <task-id>')}   Start a task (checks dependencies)`);
      console.log(`  ${color('cyan', 'complete <task-id>')} Mark task as complete (logs time)`);
      console.log(`  ${color('cyan', 'progress')}          Show progress dashboard`);
      console.log(`  ${color('cyan', 'next')}              Show recommended next tasks`);
      console.log(`  ${color('cyan', 'stats')}             Show learning statistics`);
      console.log(`  ${color('cyan', 'init')}              Initialize new learning plan`);
      console.log();
      console.log(color('bold', 'Examples:'));
      console.log();
      console.log('  # Start learning');
      console.log('  node scripts/task-manager.js start 1.1');
      console.log();
      console.log('  # After finishing study session');
      console.log('  node scripts/task-manager.js complete 1.1');
      console.log();
      console.log('  # Check progress');
      console.log('  node scripts/task-manager.js progress');
      console.log();
      console.log('  # See what to do next');
      console.log('  node scripts/task-manager.js next');
      console.log();
      console.log(color('cyan', 'Quick Start:'));
      console.log('  1. Run: node scripts/task-manager.js list');
      console.log('  2. Pick a task with "⏳" status');
      console.log('  3. Start it: node scripts/task-manager.js start <id>');
      console.log('  4. Complete it: node scripts/task-manager.js complete <id>');
      console.log();
  }
}

main();
