#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/server.pid"
LOG_FILE="$LOG_DIR/application.log"

# Create logs directory
mkdir -p "$LOG_DIR"

echo -e "${BLUE}=== CustomAutomation Server Control ===${NC}"
echo ""

# Check if server is already running
check_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            return 0  # Running
        else
            rm -f "$PID_FILE"
            return 1  # Not running
        fi
    fi
    return 1  # Not running
}

# Start server
start_server() {
    if check_server; then
        echo -e "${YELLOW}Server is already running (PID: $(cat $PID_FILE))${NC}"
        echo -e "${YELLOW}Port 8081 is in use${NC}"
        exit 0
    fi

    echo -e "${YELLOW}Starting CustomAutomation server...${NC}"
    echo -e "${BLUE}Working directory: $PROJECT_DIR${NC}"
    echo ""

    cd "$PROJECT_DIR"

    # Start the server in background
    nohup ./gradlew bootRun > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!

    # Save PID
    echo $SERVER_PID > "$PID_FILE"

    echo -e "${GREEN}Server starting with PID: $SERVER_PID${NC}"
    echo -e "${BLUE}Log file: $LOG_FILE${NC}"
    echo ""

    # Wait and check if server started successfully
    echo -e "${YELLOW}Waiting for server to start...${NC}"
    sleep 5

    for i in {1..30}; do
        if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Server is UP and running on port 8081${NC}"

            # Auto-login to Kakao after server starts
            auto_kakao_login

            return 0
        fi

        # Check if process is still alive
        if ! ps -p $SERVER_PID > /dev/null 2>&1; then
            echo -e "${RED}✗ Server process died. Check logs: $LOG_FILE${NC}"
            rm -f "$PID_FILE"
            return 1
        fi

        echo -n "."
        sleep 2
    done

    echo ""
    echo -e "${YELLOW}Server started but health check not responding yet${NC}"
    echo -e "${BLUE}Check logs: tail -f $LOG_FILE${NC}"
}

# Auto Kakao Login
auto_kakao_login() {
    echo ""
    echo -e "${BLUE}=== Kakao Auto Login ===${NC}"

    # Check if .env file exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${YELLOW}⚠ .env 파일이 없습니다. 카카오 자동 로그인을 건너뜁니다.${NC}"
        echo -e "${BLUE}카카오 로그인을 사용하려면 .env 파일을 생성하세요:${NC}"
        echo "  cp .env.example .env && nano .env"
        return 0
    fi

    # Check if credentials are set
    source "$PROJECT_DIR/.env"
    if [ -z "$KAKAO_EMAIL" ] || [ -z "$KAKAO_PASSWORD" ]; then
        echo -e "${YELLOW}⚠ .env 파일에 KAKAO_EMAIL/PASSWORD가 설정되지 않았습니다.${NC}"
        echo -e "${BLUE}카카오 로그인을 건너뜁니다.${NC}"
        return 0
    fi

    # Check if token already exists and is valid
    if [ -f "$PROJECT_DIR/kakao-tokens.json" ]; then
        echo -e "${YELLOW}기존 카카오 토큰 파일이 있습니다.${NC}"

        # Try to refresh token first
        echo -e "${YELLOW}토큰 갱신 시도 중...${NC}"

        if [ -f "$PROJECT_DIR/scripts/kakao-token-refresh.sh" ]; then
            bash "$PROJECT_DIR/scripts/kakao-token-refresh.sh" > /dev/null 2>&1

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ 카카오 토큰 갱신 완료${NC}"
                return 0
            else
                echo -e "${YELLOW}토큰 갱신 실패. 재로그인을 시도합니다.${NC}"
            fi
        fi
    fi

    # Run Kakao auto-login
    echo -e "${YELLOW}카카오 자동 로그인 실행 중...${NC}"

    cd "$PROJECT_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}npm 패키지 설치 중...${NC}"
        npm install > /dev/null 2>&1
    fi

    # Check if Playwright is installed
    if [ ! -d "node_modules/playwright" ]; then
        echo -e "${YELLOW}Playwright 설치 중...${NC}"
        npm install playwright > /dev/null 2>&1
    fi

    # Run automation script in background with timeout
    timeout 60s node scripts/kakao-auth-automation.js > "$LOG_DIR/kakao-login.log" 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 카카오 자동 로그인 성공${NC}"

        # Show token info
        if [ -f "$PROJECT_DIR/kakao-tokens.json" ]; then
            echo -e "${BLUE}토큰 저장 위치: $PROJECT_DIR/kakao-tokens.json${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ 카카오 자동 로그인 실패${NC}"
        echo -e "${BLUE}로그 확인: $LOG_DIR/kakao-login.log${NC}"
        echo -e "${BLUE}수동 로그인: ./scripts/run-kakao-login.sh${NC}"
    fi
}

# Stop server
stop_server() {
    if ! check_server; then
        echo -e "${YELLOW}Server is not running${NC}"
        exit 0
    fi

    PID=$(cat "$PID_FILE")
    echo -e "${YELLOW}Stopping server (PID: $PID)...${NC}"

    kill $PID

    # Wait for graceful shutdown
    for i in {1..15}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Server stopped successfully${NC}"
            rm -f "$PID_FILE"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    # Force kill if still running
    echo ""
    echo -e "${YELLOW}Force killing server...${NC}"
    kill -9 $PID 2>/dev/null
    rm -f "$PID_FILE"
    echo -e "${GREEN}✓ Server stopped${NC}"
}

# Restart server
restart_server() {
    echo -e "${YELLOW}Restarting server...${NC}"
    stop_server
    sleep 2
    start_server
}

# Show server status
status_server() {
    if check_server; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✓ Server is running (PID: $PID)${NC}"
        echo -e "${BLUE}Port: 8081${NC}"

        # Check health endpoint
        if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
            echo -e "${GREEN}Health check: OK${NC}"
        else
            echo -e "${YELLOW}Health check: Not responding${NC}"
        fi

        # Show memory usage
        MEM=$(ps -p $PID -o rss= | awk '{printf "%.2f MB", $1/1024}')
        echo -e "${BLUE}Memory: $MEM${NC}"
    else
        echo -e "${RED}✗ Server is not running${NC}"
    fi
}

# Show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo -e "${RED}Log file not found: $LOG_FILE${NC}"
    fi
}

# Main command handling
case "${1:-start}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        status_server
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the server"
        echo "  stop     - Stop the server"
        echo "  restart  - Restart the server"
        echo "  status   - Check server status"
        echo "  logs     - Show server logs (tail -f)"
        exit 1
        ;;
esac
