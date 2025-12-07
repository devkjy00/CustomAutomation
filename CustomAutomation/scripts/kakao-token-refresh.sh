#!/bin/bash

# 카카오 토큰 갱신 스크립트
# Refresh Token을 사용해서 새로운 Access Token을 발급받습니다

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
CLIENT_ID="620c9095c04cad076902cde3e1237d7a"
TOKEN_FILE="./kakao-tokens.json"

echo -e "${BLUE}=== 카카오 토큰 갱신 스크립트 ===${NC}\n"

# 토큰 파일 확인
if [ ! -f "$TOKEN_FILE" ]; then
    echo -e "${RED}❌ 토큰 파일을 찾을 수 없습니다: $TOKEN_FILE${NC}"
    echo ""
    echo "먼저 다음 중 하나를 실행하세요:"
    echo "  1. node kakao-auth-automation.js  (자동 로그인)"
    echo "  2. 직접 토큰 파일 생성"
    echo ""
    echo "토큰 파일 형식:"
    echo '{'
    echo '  "access_token": "your_access_token",'
    echo '  "refresh_token": "your_refresh_token",'
    echo '  "expires_in": 21599'
    echo '}'
    exit 1
fi

# Refresh Token 추출
REFRESH_TOKEN=$(cat "$TOKEN_FILE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REFRESH_TOKEN" ]; then
    echo -e "${RED}❌ Refresh Token을 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Access Token 갱신 중...${NC}"

# 토큰 갱신 요청
RESPONSE=$(curl -s -X POST "https://kauth.kakao.com/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=refresh_token" \
    -d "client_id=$CLIENT_ID" \
    -d "refresh_token=$REFRESH_TOKEN")

# 응답 확인
if echo "$RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Access Token 갱신 성공!${NC}\n"

    # 새로운 Access Token 추출
    NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    EXPIRES_IN=$(echo "$RESPONSE" | grep -o '"expires_in":[0-9]*' | cut -d':' -f2)

    echo -e "${BLUE}새로운 Access Token:${NC}"
    echo "${NEW_ACCESS_TOKEN:0:50}..."
    echo ""
    echo -e "${BLUE}만료 시간:${NC} ${EXPIRES_IN}초 (약 $(($EXPIRES_IN / 3600))시간)"

    # 토큰 파일 업데이트
    # Refresh Token이 새로 발급될 수도 있음
    if echo "$RESPONSE" | grep -q "refresh_token"; then
        NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
        cat > "$TOKEN_FILE" <<EOF
{
  "access_token": "$NEW_ACCESS_TOKEN",
  "refresh_token": "$NEW_REFRESH_TOKEN",
  "expires_in": $EXPIRES_IN,
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    else
        # Refresh Token은 그대로 유지
        cat > "$TOKEN_FILE" <<EOF
{
  "access_token": "$NEW_ACCESS_TOKEN",
  "refresh_token": "$REFRESH_TOKEN",
  "expires_in": $EXPIRES_IN,
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi

    echo ""
    echo -e "${GREEN}✓ 토큰 파일 업데이트 완료: $TOKEN_FILE${NC}"

    # 서버에 메시지 전송 테스트 (선택사항)
    echo ""
    read -p "메시지 전송 테스트를 하시겠습니까? (y/n): " TEST_MSG
    if [ "$TEST_MSG" = "y" ] || [ "$TEST_MSG" = "Y" ]; then
        echo ""
        read -p "전송할 메시지를 입력하세요: " MSG_TEXT

        echo -e "${YELLOW}메시지 전송 중...${NC}"
        MSG_RESPONSE=$(curl -s -X POST "http://localhost:8081/message/send" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$MSG_TEXT\"}")

        echo ""
        echo -e "${BLUE}서버 응답:${NC}"
        echo "$MSG_RESPONSE"
    fi

else
    echo -e "${RED}❌ 토큰 갱신 실패${NC}\n"
    echo "응답:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
