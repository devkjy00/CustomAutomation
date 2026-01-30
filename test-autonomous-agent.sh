#!/bin/bash

# 자율 검색 에이전트 테스트 스크립트
# 10가지 다양한 질문으로 시스템 안정성 및 품질 검증

echo "========================================"
echo "자율 검색 에이전트 테스트 시작"
echo "========================================"
echo ""

# 테스트 질문 배열 (다양한 유형)
declare -a questions=(
    "2024년 최신 AI 트렌드"                    # 최신 정보
    "Python과 JavaScript 차이점"               # 비교/기술
    "서울 날씨"                                 # 실시간 정보
    "ChatGPT란 무엇인가"                        # 개념 설명
    "삼성전자 주가"                             # 금융 정보
    "React vs Vue 장단점"                      # 비교 분석
    "Node.js 최신 버전"                        # 버전/릴리즈 정보
    "TypeScript 사용 이유"                     # Why 질문
    "Docker 컨테이너 개념"                     # 기술 개념
    "2024 월드컵 일정"                         # 이벤트/일정
)

# 결과 저장 파일
RESULT_FILE="/tmp/autonomous-agent-test-results.txt"
LOG_FILE="/private/tmp/ai-server.log"

echo "테스트 결과 파일: $RESULT_FILE"
echo "" > $RESULT_FILE
echo "=== 자율 검색 에이전트 테스트 결과 ===" >> $RESULT_FILE
echo "테스트 시작: $(date)" >> $RESULT_FILE
echo "" >> $RESULT_FILE

# 각 질문 테스트
test_count=0
success_count=0
fail_count=0
total_time=0

for question in "${questions[@]}"; do
    test_count=$((test_count + 1))

    echo "----------------------------------------"
    echo "테스트 $test_count/10: $question"
    echo "----------------------------------------"

    # 시작 시간
    start_time=$(date +%s)

    # AI 서버 로그 마커
    log_marker="[TEST-$test_count] $(date +%s)"
    echo "$log_marker" >> $LOG_FILE

    # API 호출 (180초 타임아웃)
    response=$(curl -G "http://localhost:8081/ai/search" \
        --data-urlencode "prompt=$question" \
        --max-time 180 \
        --silent \
        --write-out "\n%{http_code}" 2>&1)

    # 종료 시간
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    total_time=$((total_time + duration))

    # HTTP 상태 코드 추출
    http_code=$(echo "$response" | tail -n 1)
    answer=$(echo "$response" | head -n -1)

    # 결과 분석
    if [ "$http_code" = "200" ] && [ ${#answer} -gt 10 ]; then
        success_count=$((success_count + 1))
        status="✅ 성공"
        echo "✅ 성공 (${duration}초)"
    else
        fail_count=$((fail_count + 1))
        status="❌ 실패"
        echo "❌ 실패 (${duration}초) - HTTP: $http_code"
    fi

    # 결과 저장
    echo "[$test_count] $question" >> $RESULT_FILE
    echo "  상태: $status" >> $RESULT_FILE
    echo "  소요시간: ${duration}초" >> $RESULT_FILE
    echo "  HTTP 코드: $http_code" >> $RESULT_FILE
    echo "  응답 길이: ${#answer} 자" >> $RESULT_FILE
    echo "  응답 요약: $(echo "$answer" | head -c 200)..." >> $RESULT_FILE
    echo "" >> $RESULT_FILE

    # AI 서버 로그에서 상세 정보 추출
    sleep 2
done

# 통계 계산
avg_time=$((total_time / 10))
success_rate=$((success_count * 100 / 10))

echo ""
echo "========================================"
echo "테스트 완료"
echo "========================================"
echo "총 테스트: 10개"
echo "성공: $success_count개"
echo "실패: $fail_count개"
echo "성공률: ${success_rate}%"
echo "평균 소요시간: ${avg_time}초"
echo ""

# 통계 저장
echo "=== 테스트 통계 ===" >> $RESULT_FILE
echo "총 테스트: 10개" >> $RESULT_FILE
echo "성공: $success_count개" >> $RESULT_FILE
echo "실패: $fail_count개" >> $RESULT_FILE
echo "성공률: ${success_rate}%" >> $RESULT_FILE
echo "평균 소요시간: ${avg_time}초" >> $RESULT_FILE
echo "총 소요시간: ${total_time}초" >> $RESULT_FILE
echo "" >> $RESULT_FILE
echo "테스트 종료: $(date)" >> $RESULT_FILE

echo "상세 결과: $RESULT_FILE"
echo ""
