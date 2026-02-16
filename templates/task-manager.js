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

// Health Check Functions

// Check file structure completeness
function checkFileStructure() {
  const checks = [];
  const requiredFiles = [
    { path: CONFIG_FILE, name: 'config.json', critical: true },
    { path: DATA_FILE, name: 'progress.json', critical: false }
  ];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file.path);
    checks.push({
      name: `File: ${file.name}`,
      status: exists ? 'pass' : (file.critical ? 'fail' : 'warning'),
      message: exists ? 'Exists' : (file.critical ? 'Missing critical file' : 'Will be created on first run')
    });
  });
  
  // Check directory structure
  const dataDir = path.dirname(DATA_FILE);
  const scriptsDir = path.join(process.cwd(), 'scripts');
  
  checks.push({
    name: 'Directory: data/',
    status: fs.existsSync(dataDir) ? 'pass' : 'warning',
    message: fs.existsSync(dataDir) ? 'Exists' : 'Will be created on first run'
  });
  
  checks.push({
    name: 'Directory: scripts/',
    status: fs.existsSync(scriptsDir) ? 'pass' : 'warning',
    message: fs.existsSync(scriptsDir) ? 'Exists' : 'Optional - create for organization'
  });
  
  return checks;
}

// Check configuration format
function checkConfigFormat(tasks) {
  const checks = [];
  
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    
    // Check required fields
    checks.push({
      name: 'Config: name field',
      status: config.name ? 'pass' : 'warning',
      message: config.name ? `Found: "${config.name}"` : 'Missing - add a name for your plan'
    });
    
    checks.push({
      name: 'Config: duration field',
      status: config.duration ? 'pass' : 'warning',
      message: config.duration ? `Found: ${config.duration}` : 'Missing - add estimated duration'
    });
    
    checks.push({
      name: 'Config: tasks field',
      status: config.tasks && Object.keys(config.tasks).length > 0 ? 'pass' : 'fail',
      message: config.tasks && Object.keys(config.tasks).length > 0 
        ? `Found: ${Object.keys(config.tasks).length} tasks` 
        : 'No tasks defined - add learning tasks'
    });
    
    // Check task format
    if (config.tasks) {
      let validTaskCount = 0;
      let invalidTasks = [];
      
      Object.entries(config.tasks).forEach(([taskId, task]) => {
        const isValid = task.name && task.stage && task.week !== undefined && task.duration;
        if (isValid) {
          validTaskCount++;
        } else {
          invalidTasks.push(taskId);
        }
      });
      
      checks.push({
        name: 'Tasks: format validation',
        status: invalidTasks.length === 0 ? 'pass' : 'fail',
        message: invalidTasks.length === 0 
          ? `All ${validTaskCount} tasks properly formatted` 
          : `Invalid format in tasks: ${invalidTasks.join(', ')}`
      });
    }
  } catch (e) {
    checks.push({
      name: 'Config: JSON validity',
      status: 'fail',
      message: `Invalid JSON: ${e.message}`
    });
  }
  
  return checks;
}

// Check dependencies
function checkDependencies(tasks) {
  const checks = [];
  const taskIds = Object.keys(tasks);
  const missingDeps = [];
  const circularDeps = [];
  
  // Check for missing dependencies
  Object.entries(tasks).forEach(([taskId, task]) => {
    if (task.deps && task.deps.length > 0) {
      task.deps.forEach(depId => {
        if (!taskIds.includes(depId)) {
          missingDeps.push({ task: taskId, missing: depId });
        }
      });
    }
  });
  
  checks.push({
    name: 'Dependencies: existence',
    status: missingDeps.length === 0 ? 'pass' : 'fail',
    message: missingDeps.length === 0 
      ? 'All dependencies reference existing tasks' 
      : `${missingDeps.length} missing: ${missingDeps.map(d => `${d.task}→${d.missing}`).join(', ')}`
  });
  
  // Check for circular dependencies
  function hasCircularDep(taskId, visited = new Set(), path = []) {
    if (path.includes(taskId)) {
      return path.slice(path.indexOf(taskId)).concat([taskId]);
    }
    if (visited.has(taskId)) return null;
    
    visited.add(taskId);
    const task = tasks[taskId];
    
    if (task && task.deps) {
      for (const depId of task.deps) {
        const cycle = hasCircularDep(depId, visited, [...path, taskId]);
        if (cycle) return cycle;
      }
    }
    return null;
  }
  
  Object.keys(tasks).forEach(taskId => {
    const cycle = hasCircularDep(taskId);
    if (cycle && !circularDeps.some(c => c.join(',') === cycle.join(','))) {
      circularDeps.push(cycle);
    }
  });
  
  checks.push({
    name: 'Dependencies: circular check',
    status: circularDeps.length === 0 ? 'pass' : 'fail',
    message: circularDeps.length === 0 
      ? 'No circular dependencies found' 
      : `Circular: ${circularDeps.map(c => c.join('→')).join('; ')}`
  });
  
  // Check for orphaned tasks (high stage without deps)
  const orphanedTasks = Object.entries(tasks)
    .filter(([_, task]) => task.stage > 1 && (!task.deps || task.deps.length === 0))
    .map(([id, _]) => id);
  
  checks.push({
    name: 'Dependencies: orphaned tasks',
    status: orphanedTasks.length === 0 ? 'pass' : 'warning',
    message: orphanedTasks.length === 0 
      ? 'All tasks properly connected' 
      : `Stage>1 without deps: ${orphanedTasks.join(', ')}`
  });
  
  return checks;
}

// Check progress data integrity
function checkProgressIntegrity(tasks) {
  const checks = [];
  
  if (!fs.existsSync(DATA_FILE)) {
    checks.push({
      name: 'Progress: data file',
      status: 'warning',
      message: 'No progress data yet - will be created on first use'
    });
    return checks;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const taskIds = Object.keys(tasks);
    
    // Check for orphaned progress entries
    const progressIds = Object.keys(data.tasks || {});
    const orphanedProgress = progressIds.filter(id => !taskIds.includes(id));
    
    checks.push({
      name: 'Progress: orphaned entries',
      status: orphanedProgress.length === 0 ? 'pass' : 'warning',
      message: orphanedProgress.length === 0 
        ? 'All progress entries valid' 
        : `${orphanedProgress.length} orphaned: ${orphanedProgress.join(', ')}`
    });
    
    // Check data structure
    const hasRequiredFields = data.startDate && typeof data.totalStudyTime === 'number';
    checks.push({
      name: 'Progress: data structure',
      status: hasRequiredFields ? 'pass' : 'fail',
      message: hasRequiredFields ? 'Valid structure' : 'Missing required fields'
    });
    
  } catch (e) {
    checks.push({
      name: 'Progress: JSON validity',
      status: 'fail',
      message: `Corrupted: ${e.message}`
    });
  }
  
  return checks;
}

// Run comprehensive health check
function healthCheck(tasks, verbose = false) {
  tasks = tasks || loadTasks();
  
  console.log(color('bold', '\n🔍 Health Check\n'));
  console.log('='.repeat(60));
  console.log();
  
  const allChecks = [
    ...checkFileStructure(),
    ...checkConfigFormat(tasks),
    ...checkDependencies(tasks),
    ...checkProgressIntegrity(tasks)
  ];
  
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  
  allChecks.forEach(check => {
    const icon = check.status === 'pass' ? color('green', '✅') : 
                 check.status === 'warning' ? color('yellow', '⚠️') : color('red', '❌');
    
    console.log(`${icon} ${check.name}`);
    if (verbose || check.status !== 'pass') {
      console.log(`   ${check.message}`);
    }
    console.log();
    
    if (check.status === 'pass') passCount++;
    else if (check.status === 'warning') warningCount++;
    else failCount++;
  });
  
  // Summary
  console.log('='.repeat(60));
  console.log();
  console.log(color('bold', 'Summary:'));
  console.log(`  ${color('green', '✅')} Pass: ${passCount}`);
  console.log(`  ${color('yellow', '⚠️')} Warning: ${warningCount}`);
  console.log(`  ${color('red', '❌')} Fail: ${failCount}`);
  console.log();
  
  if (failCount === 0 && warningCount === 0) {
    console.log(color('green', '🎉 All checks passed! Your learning plan is ready.'));
  } else if (failCount === 0) {
    console.log(color('yellow', '⚠️  Plan is functional but has warnings. Review above.'));
  } else {
    console.log(color('red', '❌ Critical issues found. Run `fix` to auto-repair:'));
    console.log(color('cyan', '   node scripts/task-manager.js fix'));
  }
  console.log();
  
  return { passCount, warningCount, failCount };
}

// Diagnose specific issues
function diagnoseIssues(tasks) {
  tasks = tasks || loadTasks();
  
  console.log(color('bold', '\n🔬 Deep Diagnostics\n'));
  console.log('='.repeat(60));
  console.log();
  
  const issues = [];
  
  // Check 1: Task distribution
  const stages = [...new Set(Object.values(tasks).map(t => t.stage))].sort();
  console.log(color('cyan', '📊 Task Distribution:'));
  stages.forEach(stage => {
    const stageTasks = Object.entries(tasks).filter(([_, t]) => t.stage === stage);
    console.log(`  Stage ${stage}: ${stageTasks.length} tasks`);
  });
  console.log();
  
  // Check 2: Dependency depth
  console.log(color('cyan', '🔗 Dependency Analysis:'));
  function getDepth(taskId, memo = {}) {
    if (memo[taskId] !== undefined) return memo[taskId];
    const task = tasks[taskId];
    if (!task || !task.deps || task.deps.length === 0) {
      memo[taskId] = 0;
      return 0;
    }
    const maxDepDepth = Math.max(...task.deps.map(depId => getDepth(depId, memo)));
    memo[taskId] = maxDepDepth + 1;
    return memo[taskId];
  }
  
  const maxDepth = Math.max(...Object.keys(tasks).map(id => getDepth(id)));
  console.log(`  Maximum dependency depth: ${maxDepth}`);
  console.log();
  
  // Check 3: Progress data
  if (fs.existsSync(DATA_FILE)) {
    const data = readData();
    console.log(color('cyan', '📈 Progress Statistics:'));
    console.log(`  Total study time: ${Math.round(data.totalStudyTime / 60 * 10) / 10} hours`);
    console.log(`  Study days: ${Object.keys(data.dailyLog || {}).length}`);
    console.log(`  Completed tasks: ${Object.values(data.tasks || {}).filter(t => t.status === 'completed').length}`);
    console.log(`  In-progress tasks: ${Object.values(data.tasks || {}).filter(t => t.status === 'in_progress').length}`);
    console.log();
    
    // Check for stuck tasks
    const stuckTasks = Object.entries(data.tasks || {})
      .filter(([_, t]) => t.status === 'in_progress' && t.startedAt)
      .filter(([_, t]) => {
        const daysSince = (new Date() - new Date(t.startedAt)) / (1000 * 60 * 60 * 24);
        return daysSince > 7;
      });
    
    if (stuckTasks.length > 0) {
      issues.push({
        type: 'warning',
        message: `${stuckTasks.length} task(s) in progress for over 7 days`,
        tasks: stuckTasks.map(([id, _]) => id)
      });
    }
  }
  
  // Check 4: Duration analysis
  console.log(color('cyan', '⏱️  Duration Analysis:'));
  const durations = Object.values(tasks).map(t => {
    const match = t.duration.match(/(\d+(?:\.\d+)?)\s*(h|m)?/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase() || 'h';
    return unit === 'm' ? value / 60 : value;
  });
  
  const totalHours = durations.reduce((a, b) => a + b, 0);
  const avgHours = totalHours / durations.length;
  console.log(`  Total estimated time: ${Math.round(totalHours * 10) / 10} hours`);
  console.log(`  Average task duration: ${Math.round(avgHours * 10) / 10} hours`);
  console.log();
  
  // Recommendations
  console.log(color('bold', '💡 Recommendations:'));
  console.log();
  
  if (avgHours > 3) {
    console.log(color('yellow', '  ⚠️  Consider breaking down tasks - average duration is high'));
  }
  
  if (maxDepth > 5) {
    console.log(color('yellow', '  ⚠️  Long dependency chains may slow progress'));
  }
  
  if (issues.length === 0) {
    console.log(color('green', '  ✅ No issues detected'));
  } else {
    issues.forEach(issue => {
      const icon = issue.type === 'warning' ? color('yellow', '⚠️') : color('red', '❌');
      console.log(`  ${icon} ${issue.message}`);
      if (issue.tasks) {
        console.log(`     Tasks: ${issue.tasks.join(', ')}`);
      }
    });
  }
  console.log();
}

// Verify specific configuration
function verifyConfig(tasks, target = null) {
  tasks = tasks || loadTasks();
  
  if (target === 'deps') {
    console.log(color('bold', '\n✓ Dependency Verification\n'));
    console.log('='.repeat(60));
    console.log();
    
    const checks = checkDependencies(tasks);
    checks.forEach(check => {
      const icon = check.status === 'pass' ? color('green', '✅') : 
                   check.status === 'warning' ? color('yellow', '⚠️') : color('red', '❌');
      console.log(`${icon} ${check.message}`);
    });
    console.log();
    return;
  }
  
  if (target && tasks[target]) {
    console.log(color('bold', `\n✓ Task Verification: ${target}\n`));
    console.log('='.repeat(60));
    console.log();
    
    const task = tasks[target];
    console.log(`Name: ${task.name}`);
    console.log(`Stage: ${task.stage}`);
    console.log(`Week: ${task.week}, Day: ${task.day}`);
    console.log(`Duration: ${task.duration}`);
    console.log(`Dependencies: ${task.deps?.join(', ') || 'none'}`);
    
    // Check if deps exist
    if (task.deps && task.deps.length > 0) {
      console.log();
      console.log(color('cyan', 'Dependency Status:'));
      const data = readData();
      task.deps.forEach(depId => {
        const depTask = tasks[depId];
        const depData = data.tasks[depId];
        if (!depTask) {
          console.log(`  ${color('red', '❌')} ${depId}: Not found`);
        } else if (depData?.status === 'completed') {
          console.log(`  ${color('green', '✅')} ${depId}: ${depTask.name} (completed)`);
        } else if (depData?.status === 'in_progress') {
          console.log(`  ${color('yellow', '🔄')} ${depId}: ${depTask.name} (in progress)`);
        } else {
          console.log(`  ${color('blue', '⏳')} ${depId}: ${depTask.name} (pending)`);
        }
      });
    }
    console.log();
    return;
  }
  
  // General verification
  console.log(color('bold', '\n✓ Configuration Verification\n'));
  console.log('='.repeat(60));
  console.log();
  
  const checks = [
    ...checkFileStructure(),
    ...checkConfigFormat(tasks)
  ];
  
  checks.forEach(check => {
    const icon = check.status === 'pass' ? color('green', '✅') : 
                 check.status === 'warning' ? color('yellow', '⚠️') : color('red', '❌');
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}`);
  });
  console.log();
}

// Fix common issues
function fixIssues(tasks, dryRun = false) {
  tasks = tasks || loadTasks();
  
  console.log(color('bold', '\n🔧 Auto-Fix Issues\n'));
  console.log('='.repeat(60));
  console.log();
  
  if (dryRun) {
    console.log(color('yellow', '🔍 DRY RUN - No changes will be made\n'));
  }
  
  const fixes = [];
  
  // Fix 1: Create missing directories
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fixes.push({
      issue: 'Missing data directory',
      action: `mkdir -p ${dataDir}`
    });
    if (!dryRun) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  // Fix 2: Initialize progress.json if missing
  if (!fs.existsSync(DATA_FILE)) {
    fixes.push({
      issue: 'Missing progress.json',
      action: 'Create initial progress file'
    });
    if (!dryRun) {
      initData();
    }
  }
  
  // Fix 3: Clean orphaned progress entries
  if (fs.existsSync(DATA_FILE)) {
    const data = readData();
    const taskIds = Object.keys(tasks);
    const orphanedProgress = Object.keys(data.tasks || {}).filter(id => !taskIds.includes(id));
    
    if (orphanedProgress.length > 0) {
      fixes.push({
        issue: `${orphanedProgress.length} orphaned progress entries`,
        action: `Remove entries for: ${orphanedProgress.join(', ')}`
      });
      if (!dryRun) {
        orphanedProgress.forEach(id => delete data.tasks[id]);
        saveData(data);
      }
    }
  }
  
  // Report
  if (fixes.length === 0) {
    console.log(color('green', '✅ No issues to fix'));
  } else {
    console.log(color('cyan', `Found ${fixes.length} issue(s):\n`));
    fixes.forEach((fix, i) => {
      console.log(`${i + 1}. ${color('yellow', fix.issue)}`);
      console.log(`   Action: ${fix.action}`);
      console.log();
    });
    
    if (!dryRun) {
      console.log(color('green', '✅ All issues fixed'));
    } else {
      console.log(color('cyan', 'Run without --dry-run to apply fixes'));
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

// Enhanced initialization with progress check
function initPlanEnhanced() {
  console.log(color('bold', '\n🚀 Learning Plan Creator\n'));
  console.log('='.repeat(60));
  console.log();
  
  const dataDir = path.join(process.cwd(), 'data');
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const templateDir = path.join(__dirname); // templates directory where this script is
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Create directory structure
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(color('green', '✅'), 'Created data/ directory');
  } else {
    console.log(color('green', '✅'), 'data/ directory exists');
  }
  
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log(color('green', '✅'), 'Created scripts/ directory');
  } else {
    console.log(color('green', '✅'), 'scripts/ directory exists');
  }
  
  // Initialize progress.json
  initData();
  console.log(color('green', '✅'), 'Initialized progress.json');
  
  // Create or copy config.json
  if (!fs.existsSync(CONFIG_FILE)) {
    const templateConfig = {
      name: "My Learning Plan",
      description: "Description of what you want to learn",
      duration: "4 weeks",
      level: "beginner",
      created: currentDate,
      tasks: {
        "1.1": {
          name: "First task - define your goal",
          stage: 1,
          week: 1,
          day: 1,
          duration: "2h",
          deps: []
        }
      }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(templateConfig, null, 2));
    console.log(color('green', '✅'), 'Created template config.json');
  } else {
    console.log(color('green', '✅'), 'config.json exists');
  }
  
  // Create learning-plan.md from template
  const learningPlanPath = path.join(process.cwd(), 'learning-plan.md');
  if (!fs.existsSync(learningPlanPath)) {
    const templatePath = path.join(templateDir, 'learning-plan.md');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      content = content.replace(/\{\{name\}\}/g, 'My Learning Plan');
      content = content.replace(/\{\{description\}\}/g, 'Description of what you want to learn');
      content = content.replace(/\{\{duration\}\}/g, '4 weeks');
      content = content.replace(/\{\{level\}\}/g, 'beginner');
      content = content.replace(/\{\{created\}\}/g, currentDate);
      fs.writeFileSync(learningPlanPath, content);
      console.log(color('green', '✅'), 'Created learning-plan.md');
    } else {
      createDefaultLearningPlan(learningPlanPath, currentDate);
    }
  } else {
    console.log(color('green', '✅'), 'learning-plan.md exists');
  }
  
  // Create progress.md from template
  const progressPath = path.join(process.cwd(), 'progress.md');
  if (!fs.existsSync(progressPath)) {
    const templatePath = path.join(templateDir, 'progress.md');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      content = content.replace(/\{\{date\}\}/g, currentDate);
      fs.writeFileSync(progressPath, content);
      console.log(color('green', '✅'), 'Created progress.md');
    } else {
      createDefaultProgress(progressPath, currentDate);
    }
  } else {
    console.log(color('green', '✅'), 'progress.md exists');
  }
  
  // Create notes.md from template
  const notesPath = path.join(process.cwd(), 'notes.md');
  if (!fs.existsSync(notesPath)) {
    const templatePath = path.join(templateDir, 'notes.md');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      content = content.replace(/\{\{date\}\}/g, currentDate);
      fs.writeFileSync(notesPath, content);
      console.log(color('green', '✅'), 'Created notes.md');
    } else {
      createDefaultNotes(notesPath, currentDate);
    }
  } else {
    console.log(color('green', '✅'), 'notes.md exists');
  }
  
  // Create questions.md from template
  const questionsPath = path.join(process.cwd(), 'questions.md');
  if (!fs.existsSync(questionsPath)) {
    const templatePath = path.join(templateDir, 'questions.md');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      content = content.replace(/\{\{date\}\}/g, currentDate);
      fs.writeFileSync(questionsPath, content);
      console.log(color('green', '✅'), 'Created questions.md');
    } else {
      createDefaultQuestions(questionsPath, currentDate);
    }
  } else {
    console.log(color('green', '✅'), 'questions.md exists');
  }
  
  // Copy launch.sh to scripts directory
  const launchShTarget = path.join(scriptsDir, 'launch.sh');
  if (!fs.existsSync(launchShTarget)) {
    const launchShSource = path.join(templateDir, 'launch.sh');
    if (fs.existsSync(launchShSource)) {
      fs.copyFileSync(launchShSource, launchShTarget);
      fs.chmodSync(launchShTarget, 0o755);
      console.log(color('green', '✅'), 'Created scripts/launch.sh');
    } else {
      createDefaultLaunchSh(launchShTarget);
    }
  } else {
    console.log(color('green', '✅'), 'scripts/launch.sh exists');
  }
  
  // Copy task-manager.js to scripts directory
  const taskManagerTarget = path.join(scriptsDir, 'task-manager.js');
  if (!fs.existsSync(taskManagerTarget)) {
    const taskManagerSource = path.join(templateDir, 'task-manager.js');
    if (fs.existsSync(taskManagerSource)) {
      fs.copyFileSync(taskManagerSource, taskManagerTarget);
      fs.chmodSync(taskManagerTarget, 0o755);
      console.log(color('green', '✅'), 'Created scripts/task-manager.js');
    }
  } else {
    console.log(color('green', '✅'), 'scripts/task-manager.js exists');
  }
  
  console.log();
  console.log(color('cyan', '📋 Next steps:'));
  console.log('  1. Edit data/config.json to define your tasks');
  console.log('  2. Review learning-plan.md for your plan overview');
  console.log('  3. Run: node scripts/task-manager.js check');
  console.log('  4. Start learning: ./scripts/launch.sh or node scripts/task-manager.js list');
  console.log();
  console.log(color('yellow', '📚 Documentation files created:'));
  console.log('  - learning-plan.md: Main plan overview');
  console.log('  - progress.md: Track your daily progress');
  console.log('  - notes.md: Study notes and references');
  console.log('  - questions.md: Q&A tracking');
  console.log();
}

// Default content creators if templates not found
function createDefaultLearningPlan(filePath, date) {
  const content = `# My Learning Plan

> 🎯 **Goal**: Description of what you want to learn
> 📅 **Duration**: 4 weeks
> 👤 **Level**: beginner
> 📍 **Created**: ${date}

---

## 📊 Learning Overview

Track your progress through this learning plan using the task manager commands.

---

## 🎯 Learning Objectives

By the end of this plan, you will be able to:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

---

## 📝 Daily Checklist

Each study session:
- [ ] Today's goal is clear
- [ ] Started task with: \`node scripts/task-manager.js start <id>\`
- [ ] Completed task with: \`node scripts/task-manager.js complete <id>\`
- [ ] Updated progress.md with learnings
- [ ] Noted questions in questions.md

---

## 🛠️ Quick Commands

| Command | Description |
|---------|-------------|
| \`node scripts/task-manager.js list\` | List all tasks |
| \`node scripts/task-manager.js start <id>\` | Start a task |
| \`node scripts/task-manager.js complete <id>\` | Complete a task |
| \`node scripts/task-manager.js progress\` | View progress |
| \`node scripts/task-manager.js check\` | Health check |
| \`./scripts/launch.sh\` | Interactive menu |

---

**Happy Learning!** 🎓✨
`;
  fs.writeFileSync(filePath, content);
  console.log(color('green', '✅'), 'Created learning-plan.md (default)');
}

function createDefaultProgress(filePath, date) {
  const content = `# Learning Progress Log

> Track your daily learning progress, insights, and reflections here.

---

## 📅 Session Log

### ${date} - Session #1

**Tasks Completed:**
- [ ] Task 1.1: First task

**Time Spent:** 

**What I Learned:**
- 

**Challenges:**
- 

**Next Steps:**
- 

---

**Last Updated:** ${date}
`;
  fs.writeFileSync(filePath, content);
  console.log(color('green', '✅'), 'Created progress.md (default)');
}

function createDefaultNotes(filePath, date) {
  const content = `# Learning Notes

> Central place for all your study notes, summaries, and reference materials.

---

## 📝 Quick Reference

### Commands Cheat Sheet

\`\`\`bash
node scripts/task-manager.js list
node scripts/task-manager.js start <task-id>
node scripts/task-manager.js complete <task-id>
node scripts/task-manager.js progress
node scripts/task-manager.js check
\`\`\`

---

## 📚 Topic Notes

### Topic 1

**Key Concepts:**
- 

---

**Created:** ${date}
`;
  fs.writeFileSync(filePath, content);
  console.log(color('green', '✅'), 'Created notes.md (default)');
}

function createDefaultQuestions(filePath, date) {
  const content = `# Questions & Answers

> Track questions that arise during learning and their answers.

---

## ❓ Unanswered Questions

1. **Question:** 
   - **Related Task:** 
   - **Priority:** 

---

## ✅ Answered Questions

### Question: 

**Answer:** 

**Date Answered:** ${date}

---

**Created:** ${date}
`;
  fs.writeFileSync(filePath, content);
  console.log(color('green', '✅'), 'Created questions.md (default)');
}

function createDefaultLaunchSh(filePath) {
  const content = `#!/bin/bash
# Interactive Learning Plan Launcher
cd "$(dirname "$0")/.."
node scripts/task-manager.js list
`;
  fs.writeFileSync(filePath, content);
  fs.chmodSync(filePath, 0o755);
  console.log(color('green', '✅'), 'Created scripts/launch.sh (default)');
}

// Main function
function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const subArg = process.argv[4];
  
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
    case 'check':
      healthCheck(tasks, arg === '--verbose');
      break;
    case 'diagnose':
      diagnoseIssues(tasks);
      break;
    case 'verify':
      verifyConfig(tasks, arg);
      break;
    case 'fix':
      fixIssues(tasks, arg === '--dry-run');
      break;
    case 'init':
      initPlanEnhanced();
      break;
    case '--help':
    case '-h':
    default:
      console.log(color('bold', '\n📚 Learning Plan Task Manager\n'));
      console.log('='.repeat(60));
      console.log();
      console.log('Usage: node scripts/task-manager.js <command> [options]');
      console.log();
      console.log(color('bold', 'Task Commands:'));
      console.log();
      console.log(`  ${color('cyan', 'list')}              List all tasks`);
      console.log(`  ${color('cyan', 'list --today')}      List tasks available to start today`);
      console.log(`  ${color('cyan', 'start <task-id>')}   Start a task (checks dependencies)`);
      console.log(`  ${color('cyan', 'complete <task-id>')} Mark task as complete (logs time)`);
      console.log();
      console.log(color('bold', 'Progress Commands:'));
      console.log();
      console.log(`  ${color('cyan', 'progress')}          Show progress dashboard`);
      console.log(`  ${color('cyan', 'next')}              Show recommended next tasks`);
      console.log(`  ${color('cyan', 'stats')}             Show learning statistics`);
      console.log();
      console.log(color('bold', 'Health Check Commands:'));
      console.log();
      console.log(`  ${color('cyan', 'check')}             Run comprehensive health check`);
      console.log(`  ${color('cyan', 'check --verbose')}   Show all check details`);
      console.log(`  ${color('cyan', 'diagnose')}          Deep diagnostics and analysis`);
      console.log(`  ${color('cyan', 'verify')}            Verify configuration`);
      console.log(`  ${color('cyan', 'verify deps')}      Verify dependencies only`);
      console.log(`  ${color('cyan', 'verify <task-id>')}  Verify specific task`);
      console.log(`  ${color('cyan', 'fix')}               Auto-fix common issues`);
      console.log(`  ${color('cyan', 'fix --dry-run')}    Preview fixes without applying`);
      console.log();
      console.log(color('bold', 'Setup Commands:'));
      console.log();
      console.log(`  ${color('cyan', 'init')}              Initialize new learning plan`);
      console.log();
      console.log(color('bold', 'Examples:'));
      console.log();
      console.log('  # Start learning');
      console.log('  node scripts/task-manager.js start 1.1');
      console.log();
      console.log('  # Check your plan health');
      console.log('  node scripts/task-manager.js check');
      console.log();
      console.log('  # After finishing study session');
      console.log('  node scripts/task-manager.js complete 1.1');
      console.log();
      console.log('  # View progress and stats');
      console.log('  node scripts/task-manager.js progress');
      console.log('  node scripts/task-manager.js stats');
      console.log();
      console.log(color('cyan', 'Quick Start:'));
      console.log('  1. Initialize: node scripts/task-manager.js init');
      console.log('  2. Check: node scripts/task-manager.js check');
      console.log('  3. List: node scripts/task-manager.js list');
      console.log('  4. Start: node scripts/task-manager.js start <id>');
      console.log('  5. Complete: node scripts/task-manager.js complete <id>');
      console.log();
  }
}

main();
