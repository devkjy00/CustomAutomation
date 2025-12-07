# Server Management Guide

AI 서버와 CustomAuto 서버를 한번에 관리하는 가이드입니다.

## 📋 개요

`manage-servers.sh` 스크립트는 다음 두 서버를 통합 관리합니다:

- **AI Server**: Ollama 기반 AI 추론 서버 (Port 3000)
- **CustomAuto Server**: Spring Boot 애플리케이션 (Port 8081)

## 🚀 빠른 시작

### 1. 명령줄 모드

```bash
# 모든 서버 시작
./manage-servers.sh start

# 모든 서버 중지
./manage-servers.sh stop

# 모든 서버 재시작
./manage-servers.sh restart

# 서버 상태 확인
./manage-servers.sh status

# 로그 확인
./manage-servers.sh logs
```

### 2. 인터랙티브 모드

```bash
# 메뉴 모드 실행
./manage-servers.sh
```

인터랙티브 메뉴:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Server Management Menu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) Start All Servers
2) Stop All Servers
3) Restart All Servers
4) Check Status
5) Start AI Server Only
6) Stop AI Server Only
7) Start CustomAuto Server Only
8) Stop CustomAuto Server Only
9) View Logs
0) Exit
```

## 📂 서버 정보

### AI Server

- **경로**: `/Users/jy_mac/MyDir/project/customAuto/AI/my-project`
- **포트**: 3000
- **실행**: `npm start`
- **로그**: `ai-server.log`
- **기술**: Node.js + Ollama (gemma3:27b)

### CustomAuto Server

- **경로**: `/Users/jy_mac/MyDir/project/customAuto/CustomAutomation`
- **포트**: 8081
- **실행**: `./start-server.sh`
- **로그**: `logs/application.log`
- **기술**: Spring Boot 3.2.0 + Java 17

## 🔧 주요 기능

### 1. 자동 시작 순서

```bash
./manage-servers.sh start
```

1. AI 서버 먼저 시작 (CustomAuto가 의존)
2. AI 서버 시작 확인 (최대 20초 대기)
3. CustomAuto 서버 시작
4. 카카오 자동 로그인 실행
5. 최종 상태 확인

### 2. 안전한 종료

```bash
./manage-servers.sh stop
```

1. CustomAuto 서버 먼저 중지
2. AI 서버 중지
3. 프로세스 정리 확인
4. 필요시 강제 종료 (kill -9)

### 3. 상태 확인

```bash
./manage-servers.sh status
```

**출력 예시:**
```
=== Server Status ===

✓ AI Server is running on port 3000
✓ CustomAuto Server is running on port 8081
```

### 4. 로그 확인

```bash
./manage-servers.sh logs
```

**옵션:**
- AI Server 로그만 보기
- CustomAuto Server 로그만 보기
- 두 로그 모두 보기

## 🎯 사용 시나리오

### 개발 시작

```bash
# 하루 작업 시작
./manage-servers.sh start
```

### 개발 종료

```bash
# 하루 작업 종료
./manage-servers.sh stop
```

### 코드 변경 후 재시작

```bash
# 빠른 재시작
./manage-servers.sh restart
```

### 문제 발생 시

```bash
# 1. 상태 확인
./manage-servers.sh status

# 2. 로그 확인
./manage-servers.sh logs

# 3. 재시작 시도
./manage-servers.sh restart
```

### AI 서버만 재시작

```bash
# 인터랙티브 모드에서
./manage-servers.sh

# 선택: 6) Stop AI Server Only
# 선택: 5) Start AI Server Only
```

## ⚙️ 환경변수 설정

### Slack Webhook URL

스크립트는 다음 순서로 Slack Webhook URL을 확인합니다:

1. **환경변수** (우선순위 높음)
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
./manage-servers.sh start
```

2. **스크립트 기본값** (환경변수 없을 시)
```bash
# 스크립트 내부 기본값 사용
./manage-servers.sh start
```

### .env 파일 사용

```bash
# .env 파일 생성
cat > .env << EOF
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EOF

# 환경변수 로드 후 실행
source .env
./manage-servers.sh start
```

## 🔍 문제 해결

### 서버가 시작되지 않을 때

```bash
# 1. 포트 사용 확인
lsof -i :3000  # AI Server
lsof -i :8081  # CustomAuto Server

# 2. 프로세스 강제 종료
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:8081)

# 3. 재시작
./manage-servers.sh start
```

### AI 서버 응답 없음

```bash
# 1. AI 서버 로그 확인
tail -50 /Users/jy_mac/MyDir/project/customAuto/AI/my-project/ai-server.log

# 2. Ollama 서비스 확인
ollama list

# 3. AI 서버 재시작
./manage-servers.sh
# 선택: 6, 5
```

### CustomAuto 서버 에러

```bash
# 1. 로그 확인
tail -100 logs/application.log

# 2. 카카오 토큰 확인
cat kakao-token.json

# 3. 재시작
./manage-servers.sh restart
```

## 📊 스크립트 동작 원리

### 시작 프로세스

```
[AI Server Start]
├── npm start (background)
├── Wait for port 3000
└── Success ✓

[CustomAuto Server Start]
├── Set SLACK_WEBHOOK_URL
├── ./start-server.sh start
├── Kakao Auto Login
└── Success ✓
```

### 중지 프로세스

```
[CustomAuto Server Stop]
├── ./start-server.sh stop
└── Success ✓

[AI Server Stop]
├── Find PID (lsof -ti:3000)
├── kill PID
├── Verify stopped
└── Success ✓
```

## 🎨 출력 색상 의미

- 🔵 **파란색**: 정보 메시지
- 🟢 **초록색**: 성공 메시지
- 🟡 **노란색**: 진행 중 메시지
- 🔴 **빨간색**: 에러 메시지

## 📝 로그 위치

```
AI Server:
  /Users/jy_mac/MyDir/project/customAuto/AI/my-project/ai-server.log

CustomAuto Server:
  /Users/jy_mac/MyDir/project/customAuto/CustomAutomation/logs/application.log

Kakao Login:
  /Users/jy_mac/MyDir/project/customAuto/CustomAutomation/logs/kakao-login.log
```

## 🚨 주의사항

1. **실행 순서**: AI 서버가 먼저 시작되어야 합니다
2. **포트 충돌**: 3000, 8081 포트가 이미 사용 중이면 실패합니다
3. **권한 문제**: 스크립트 실행 권한이 필요합니다 (`chmod +x`)
4. **Ollama 필수**: AI 서버 실행 전 Ollama가 설치되어 있어야 합니다
5. **환경변수**: Slack Webhook URL이 설정되어야 Slack 메시지 전송이 가능합니다

## 📌 팁

### 백그라운드 실행

```bash
# 터미널 종료해도 계속 실행
nohup ./manage-servers.sh start > /dev/null 2>&1 &
```

### 자동 시작 설정

```bash
# crontab 추가
crontab -e

# 부팅 시 자동 시작
@reboot cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./manage-servers.sh start
```

### 별칭(Alias) 설정

```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
alias servers='cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./manage-servers.sh'
alias servers-start='cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./manage-servers.sh start'
alias servers-stop='cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./manage-servers.sh stop'
alias servers-status='cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./manage-servers.sh status'

# 적용
source ~/.zshrc

# 사용
servers-start  # 서버 시작
servers-stop   # 서버 중지
servers-status # 상태 확인
servers        # 메뉴 모드
```

## 🔗 관련 문서

- [Scheduler Guide](./SCHEDULER-GUIDE.md) - 스케줄러 설정 가이드
- [Kakao Auto Login Guide](./KAKAO-AUTO-LOGIN-GUIDE.md) - 카카오 로그인 가이드
- [Auto Start README](./AUTO-START-README.md) - 자동 시작 설정
