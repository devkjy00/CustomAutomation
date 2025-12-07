#!/bin/bash

#######################################
# Server Management Script
# AI Server (port 3000) + CustomAuto Server (port 8081)
#######################################

# Load environment variables from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env"
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server paths
AI_SERVER_DIR="/Users/jy_mac/MyDir/project/customAuto/AI/my-project"
CUSTOM_AUTO_DIR="/Users/jy_mac/MyDir/project/customAuto/CustomAutomation"

# PID files
AI_PID_FILE="/tmp/ai-server.pid"
CUSTOM_AUTO_PID_FILE="/tmp/custom-auto-server.pid"

# Log files
AI_LOG_FILE="/tmp/ai-server.log"
CUSTOM_AUTO_LOG_FILE="$CUSTOM_AUTO_DIR/logs/application.log"

#######################################
# Helper Functions
#######################################

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

#######################################
# AI Server Functions
#######################################

start_ai_server() {
    print_header "Starting AI Server"

    if is_ai_server_running; then
        print_warning "AI Server is already running (PID: $(cat $AI_PID_FILE))"
        return 0
    fi

    print_info "Starting AI Server on port 3000..."
    cd "$AI_SERVER_DIR"

    # Start server in background and save PID
    nohup npm start > "$AI_LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$AI_PID_FILE"

    # Wait for server to start
    sleep 3

    if is_ai_server_running; then
        print_success "AI Server started successfully (PID: $pid)"
        return 0
    else
        print_error "Failed to start AI Server"
        rm -f "$AI_PID_FILE"
        return 1
    fi
}

stop_ai_server() {
    print_header "Stopping AI Server"

    if ! is_ai_server_running; then
        print_warning "AI Server is not running"
        return 0
    fi

    local pid=$(cat "$AI_PID_FILE")
    print_info "Stopping AI Server (PID: $pid)..."

    kill $pid 2>/dev/null
    sleep 2

    # Force kill if still running
    if is_ai_server_running; then
        print_warning "Force killing AI Server..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi

    rm -f "$AI_PID_FILE"

    if ! is_ai_server_running; then
        print_success "AI Server stopped successfully"
        return 0
    else
        print_error "Failed to stop AI Server"
        return 1
    fi
}

is_ai_server_running() {
    if [ -f "$AI_PID_FILE" ]; then
        local pid=$(cat "$AI_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

get_ai_server_status() {
    if is_ai_server_running; then
        local pid=$(cat "$AI_PID_FILE")
        echo -e "${GREEN}Running${NC} (PID: $pid, Port: 3000)"
    else
        echo -e "${RED}Stopped${NC}"
    fi
}

#######################################
# CustomAuto Server Functions
#######################################
# CustomAuto 서버 시작

start_custom_auto_server() {
    echo -e "\n${YELLOW}Starting CustomAuto Server...${NC}"

    cd "$CUSTOM_AUTO_DIR" || {
        echo -e "${RED}Failed to change directory to CustomAuto${NC}"
        return 1
    }

    # Slack Webhook URL 환경변수 설정
    export SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"

    ./start-server.sh start
    return $?
}

# CustomAuto 서버 중지
stop_custom_auto_server() {
    echo -e "\n${YELLOW}Stopping CustomAuto Server...${NC}"

    cd "$CUSTOM_AUTO_DIR" || {
        echo -e "${RED}Failed to change directory to CustomAuto${NC}"
        return 1
    }

    ./start-server.sh stop
    return $?
}


is_custom_auto_running() {
    # Check if port 8081 is in use
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

get_custom_auto_status() {
    if is_custom_auto_running; then
        local port_pid=$(lsof -ti:8081)
        echo -e "${GREEN}Running${NC} (PID: $port_pid, Port: 8081)"
    else
        echo -e "${RED}Stopped${NC}"
    fi
}

#######################################
# Combined Server Functions
#######################################

start_all() {
    print_header "Starting All Servers"

    # Start AI server first (CustomAuto depends on it)
    start_ai_server

    # Wait a bit before starting CustomAuto
    sleep 2

    # Start CustomAuto server
    start_custom_auto_server

    echo ""
    status_all
}

stop_all() {
    print_header "Stopping All Servers"

    # Stop CustomAuto first (it depends on AI server)
    stop_custom_auto_server

    # Wait a bit before stopping AI server
    sleep 2

    # Stop AI server
    stop_ai_server

    echo ""
    status_all
}

restart_all() {
    print_header "Restarting All Servers"
    stop_all
    sleep 2
    start_all
}

status_all() {
    print_header "Server Status"
    echo -e "AI Server:         $(get_ai_server_status)"
    echo -e "CustomAuto Server: $(get_custom_auto_status)"
    echo ""

    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        print_info "Slack Webhook: Configured"
    else
        print_warning "Slack Webhook: Not configured (using default)"
    fi
}

#######################################
# Log Functions
#######################################

view_ai_logs() {
    print_header "AI Server Logs (last 50 lines)"
    if [ -f "$AI_LOG_FILE" ]; then
        tail -50 "$AI_LOG_FILE"
    else
        print_error "AI Server log file not found"
    fi
}

view_custom_auto_logs() {
    print_header "CustomAuto Server Logs (last 50 lines)"
    if [ -f "$CUSTOM_AUTO_LOG_FILE" ]; then
        tail -50 "$CUSTOM_AUTO_LOG_FILE"
    else
        print_error "CustomAuto Server log file not found"
    fi
}

view_all_logs() {
    view_ai_logs
    echo ""
    view_custom_auto_logs
}

#######################################
# Interactive Menu
#######################################

show_menu() {
    clear
    print_header "Server Management Menu"
    echo ""
    status_all
    echo ""
    echo "1) Start all servers"
    echo "2) Stop all servers"
    echo "3) Restart all servers"
    echo "4) Start AI server only"
    echo "5) Start CustomAuto server only"
    echo "6) Stop AI server only"
    echo "7) Stop CustomAuto server only"
    echo "8) View AI server logs"
    echo "9) View CustomAuto server logs"
    echo "10) View all logs"
    echo "11) Check status"
    echo "0) Exit"
    echo ""
}

interactive_menu() {
    while true; do
        show_menu
        read -p "Select option: " choice

        case $choice in
            1) start_all; read -p "Press Enter to continue..." ;;
            2) stop_all; read -p "Press Enter to continue..." ;;
            3) restart_all; read -p "Press Enter to continue..." ;;
            4) start_ai_server; read -p "Press Enter to continue..." ;;
            5) start_custom_auto_server; read -p "Press Enter to continue..." ;;
            6) stop_ai_server; read -p "Press Enter to continue..." ;;
            7) stop_custom_auto_server; read -p "Press Enter to continue..." ;;
            8) view_ai_logs; read -p "Press Enter to continue..." ;;
            9) view_custom_auto_logs; read -p "Press Enter to continue..." ;;
            10) view_all_logs; read -p "Press Enter to continue..." ;;
            11) status_all; read -p "Press Enter to continue..." ;;
            0) exit 0 ;;
            *) print_error "Invalid option"; read -p "Press Enter to continue..." ;;
        esac
    done
}

#######################################
# Main Script
#######################################

# If no arguments, show interactive menu
if [ $# -eq 0 ]; then
    interactive_menu
    exit 0
fi

# Parse command line arguments
case "$1" in
    start)
        if [ -z "$2" ]; then
            start_all
        elif [ "$2" = "ai" ]; then
            start_ai_server
        elif [ "$2" = "custom" ]; then
            start_custom_auto_server
        else
            print_error "Invalid server name: $2"
            exit 1
        fi
        ;;
    stop)
        if [ -z "$2" ]; then
            stop_all
        elif [ "$2" = "ai" ]; then
            stop_ai_server
        elif [ "$2" = "custom" ]; then
            stop_custom_auto_server
        else
            print_error "Invalid server name: $2"
            exit 1
        fi
        ;;
    restart)
        if [ -z "$2" ]; then
            restart_all
        elif [ "$2" = "ai" ]; then
            stop_ai_server
            sleep 2
            start_ai_server
        elif [ "$2" = "custom" ]; then
            stop_custom_auto_server
            sleep 2
            start_custom_auto_server
        else
            print_error "Invalid server name: $2"
            exit 1
        fi
        ;;
    status)
        status_all
        ;;
    logs)
        if [ -z "$2" ]; then
            view_all_logs
        elif [ "$2" = "ai" ]; then
            view_ai_logs
        elif [ "$2" = "custom" ]; then
            view_custom_auto_logs
        else
            print_error "Invalid server name: $2"
            exit 1
        fi
        ;;
    menu)
        interactive_menu
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|menu} [ai|custom]"
        echo ""
        echo "Commands:"
        echo "  start [ai|custom]   - Start all servers or specific server"
        echo "  stop [ai|custom]    - Stop all servers or specific server"
        echo "  restart [ai|custom] - Restart all servers or specific server"
        echo "  status              - Show server status"
        echo "  logs [ai|custom]    - View logs (all or specific server)"
        echo "  menu                - Show interactive menu"
        echo ""
        echo "Examples:"
        echo "  $0 start           # Start all servers"
        echo "  $0 start ai        # Start AI server only"
        echo "  $0 stop custom     # Stop CustomAuto server only"
        echo "  $0 restart         # Restart all servers"
        echo "  $0 logs ai         # View AI server logs"
        echo "  $0 menu            # Interactive menu"
        exit 1
        ;;
esac
