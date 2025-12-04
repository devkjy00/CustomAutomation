#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 카카오 로그인 자동화 ===${NC}\n"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env 파일을 찾을 수 없습니다.${NC}\n"
    echo "다음 명령으로 .env 파일을 생성하세요:"
    echo ""
    echo -e "${YELLOW}cp .env.example .env${NC}"
    echo -e "${YELLOW}nano .env${NC}"
    echo ""
    echo ".env 파일에 다음 내용을 입력하세요:"
    echo "KAKAO_EMAIL=your-email@example.com"
    echo "KAKAO_PASSWORD=your-password"
    echo ""
    exit 1
fi

# Check if credentials are set
source .env
if [ -z "$KAKAO_EMAIL" ] || [ -z "$KAKAO_PASSWORD" ]; then
    echo -e "${RED}❌ .env 파일에 KAKAO_EMAIL 또는 KAKAO_PASSWORD가 설정되지 않았습니다.${NC}\n"
    echo ".env 파일을 확인하세요:"
    echo -e "${YELLOW}nano .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .env 파일 확인 완료${NC}"
echo -e "${BLUE}Email: ${KAKAO_EMAIL}${NC}\n"

# Check if server is running
echo -e "${YELLOW}서버 상태 확인 중...${NC}"
if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CustomAutomation 서버 실행 중 (port 8081)${NC}\n"
else
    echo -e "${RED}⚠ CustomAutomation 서버가 실행되지 않았습니다.${NC}"
    echo -e "${YELLOW}서버를 먼저 시작하세요: ./start-server.sh start${NC}\n"
    read -p "계속 진행하시겠습니까? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
    echo ""
fi

# Run the automation script
echo -e "${YELLOW}🚀 Playwright 자동화 시작...${NC}\n"
node kakao-auth-automation.js

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ 자동화 완료!${NC}\n"

    # Show token file if exists
    if [ -f "kakao-tokens.json" ]; then
        echo -e "${BLUE}=== 발급된 토큰 정보 ===${NC}"
        cat kakao-tokens.json | head -5
        echo ""
    fi

    # Test message sending
    echo ""
    read -p "테스트 메시지를 전송하시겠습니까? (y/n): " TEST
    if [ "$TEST" = "y" ] || [ "$TEST" = "Y" ]; then
        echo ""
        read -p "전송할 메시지: " MSG

        echo -e "${YELLOW}메시지 전송 중...${NC}"
        RESPONSE=$(curl -s -X POST http://localhost:8081/message/send \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$MSG\"}")

        echo ""
        echo -e "${BLUE}서버 응답:${NC}"
        echo "$RESPONSE"
    fi
else
    echo ""
    echo -e "${RED}❌ 자동화 실패${NC}"
    echo "로그를 확인하세요."
fi
