#!/bin/bash
#
# Interactive Learning Plan Launcher
# Provides a user-friendly menu for managing your learning plan
#

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 14+ to use this learning plan"
    exit 1
fi

# Check if task-manager.js exists
if [ ! -f "$SCRIPT_DIR/task-manager.js" ]; then
    echo -e "${RED}Error: task-manager.js not found${NC}"
    echo "Expected at: $SCRIPT_DIR/task-manager.js"
    exit 1
fi

# Function to run task manager command
run_tm() {
    node "$SCRIPT_DIR/task-manager.js" "$@"
    echo
    read -p "Press Enter to continue..."
}

# Function to show banner
show_banner() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo '  _                    _                 _       _'
    echo ' | |    ___   __ _  __| | ___ _ __   ___| | __ _| |_ ___'
    echo ' | |   / _ \ / _` |/ _` |/ _ \ |__| / __| |/ _` | __/ _ \'
    echo ' | |__| (_) | (_| | (_| |  __/ |    \__ \ | (_| | ||  __/'
    echo ' |_____\___/ \__,_|\__,_|\___|_|    |___/_|\__,_|\__\___|'
    echo -e "${NC}"
    echo -e "${BOLD}Learning Plan Manager${NC}"
    echo
    
    # Show current status
    if [ -f "$DATA_DIR/config.json" ]; then
        PLAN_NAME=$(node -e "console.log(require('$DATA_DIR/config.json').name || 'My Learning Plan')" 2>/dev/null || echo "My Learning Plan")
        echo -e "${GREEN}📚 Plan: $PLAN_NAME${NC}"
        
        # Show quick stats
        if [ -f "$DATA_DIR/progress.json" ]; then
            TOTAL_TASKS=$(node -e "const t=require('$DATA_DIR/config.json').tasks||{}; console.log(Object.keys(t).length)" 2>/dev/null || echo "0")
            COMPLETED=$(node -e "const d=require('$DATA_DIR/progress.json'); console.log(Object.values(d.tasks||{}).filter(t=>t.status==='completed').length)" 2>/dev/null || echo "0")
            PROGRESS=$(( COMPLETED * 100 / (TOTAL_TASKS > 0 ? TOTAL_TASKS : 1) ))
            echo -e "${BLUE}📊 Progress: ${BOLD}${PROGRESS}%${NC} (${COMPLETED}/${TOTAL_TASKS} tasks)"
        fi
    else
        echo -e "${YELLOW}⚠️  No learning plan configured${NC}"
    fi
    echo
}

# Function to check plan health
check_health() {
    echo -e "${CYAN}Running health check...${NC}"
    node "$SCRIPT_DIR/task-manager.js" check
    echo
    read -p "Press Enter to continue..."
}

# Function to edit config
edit_config() {
    # Try to find a text editor
    if command -v code &> /dev/null; then
        code "$DATA_DIR/config.json"
    elif command -v vim &> /dev/null; then
        vim "$DATA_DIR/config.json"
    elif command -v nano &> /dev/null; then
        nano "$DATA_DIR/config.json"
    else
        echo -e "${YELLOW}Please edit: $DATA_DIR/config.json${NC}"
        read -p "Press Enter when done..."
    fi
}

# Function to open progress log
open_progress() {
    if command -v code &> /dev/null; then
        code "$PROJECT_DIR/progress.md"
    elif command -v vim &> /dev/null; then
        vim "$PROJECT_DIR/progress.md"
    elif command -v nano &> /dev/null; then
        nano "$PROJECT_DIR/progress.md"
    else
        echo -e "${YELLOW}Please open: $PROJECT_DIR/progress.md${NC}"
        read -p "Press Enter to continue..."
    fi
}

# Function to open notes
open_notes() {
    if command -v code &> /dev/null; then
        code "$PROJECT_DIR/notes.md"
    elif command -v vim &> /dev/null; then
        vim "$PROJECT_DIR/notes.md"
    elif command -v nano &> /dev/null; then
        nano "$PROJECT_DIR/notes.md"
    else
        echo -e "${YELLOW}Please open: $PROJECT_DIR/notes.md${NC}"
        read -p "Press Enter to continue..."
    fi
}

# Main menu loop
while true; do
    show_banner
    
    echo -e "${BOLD}Main Menu:${NC}"
    echo
    echo -e "${CYAN}1)${NC} 📖 View All Tasks"
    echo -e "${CYAN}2)${NC} 📋 View Today's Tasks"
    echo -e "${CYAN}3)${NC} 📊 View Progress Dashboard"
    echo -e "${CYAN}4)${NC} 📈 View Statistics"
    echo -e "${CYAN}5)${NC} 🎯 Start a Task"
    echo -e "${CYAN}6)${NC} ✅ Complete a Task"
    echo -e "${CYAN}7)${NC} 🔍 Health Check"
    echo -e "${CYAN}8)${NC} 📝 Open Progress Log"
    echo -e "${CYAN}9)${NC} 📚 Open Notes"
    echo -e "${CYAN}10)${NC} ⚙️  Edit Configuration"
    echo -e "${CYAN}11)${NC} 🔧 Diagnose Issues"
    echo -e "${CYAN}12)${NC} ❓ Help"
    echo -e "${CYAN}0)${NC} 🚪 Exit"
    echo
    
    read -p "Enter your choice: " choice
    echo
    
    case $choice in
        1)
            run_tm list
            ;;
        2)
            run_tm list --today
            ;;
        3)
            run_tm progress
            ;;
        4)
            run_tm stats
            ;;
        5)
            read -p "Enter task ID (e.g., 1.1): " task_id
            if [ -n "$task_id" ]; then
                run_tm start "$task_id"
            fi
            ;;
        6)
            read -p "Enter task ID (e.g., 1.1): " task_id
            if [ -n "$task_id" ]; then
                run_tm complete "$task_id"
            fi
            ;;
        7)
            check_health
            ;;
        8)
            open_progress
            ;;
        9)
            open_notes
            ;;
        10)
            edit_config
            ;;
        11)
            run_tm diagnose
            ;;
        12)
            clear
            echo -e "${BOLD}${CYAN}📚 Learning Plan Help${NC}"
            echo
            echo "This interactive menu helps you manage your learning plan."
            echo
            echo -e "${BOLD}Quick Start:${NC}"
            echo "  1. View Today's Tasks (option 2) to see what you can start"
            echo "  2. Start a Task (option 5) with the task ID"
            echo "  3. After studying, Complete the Task (option 6)"
            echo "  4. Check Progress (option 3) to see your advancement"
            echo
            echo -e "${BOLD}Tips:${NC}"
            echo "  • Use Health Check (option 7) to verify your plan"
            echo "  • Update Progress Log (option 8) with daily learnings"
            echo "  • Edit Configuration (option 10) to customize tasks"
            echo
            echo -e "${BOLD}Task ID Format:${NC}"
            echo "  Tasks are numbered like '1.1', '1.2', '2.1', etc."
            echo "  Format: <stage>.<sequence>"
            echo
            read -p "Press Enter to continue..."
            ;;
        0)
            echo -e "${GREEN}Happy Learning! 🎓${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 1
            ;;
    esac
done
