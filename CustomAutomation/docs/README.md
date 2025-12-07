# CustomAutomation 문서 모음

이 디렉토리에는 CustomAutomation 프로젝트의 모든 구현 관련 문서가 포함되어 있습니다.

## 📚 문서 목록

### 1. [SCHEDULER-GUIDE.md](./SCHEDULER-GUIDE.md)
**정기 메시지 스케줄러 가이드**

- 1시간마다 AI 응답을 카카오톡으로 자동 전송
- Spring @Scheduled 기반 스케줄링
- 8가지 테마별 시간대 자동 선택
- 수동 테스트 및 커스텀 테마 추가

**주요 내용:**
- ✅ 시간대별 테마 자동 선택
- ✅ Dalai AI 연동
- ✅ Cron 표현식 설정
- ✅ API 테스트 엔드포인트

---

### 2. [KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md)
**카카오 로그인 자동화 완벽 가이드**

- 시스템 아키텍처 및 플로우 다이어그램
- Playwright를 사용한 자동화 구현 상세 설명
- 단계별 자동화 프로세스
- 에러 코드 및 해결 방법 (KOE205, KOE320 등)
- 보안 고려사항 및 디버깅 팁

**주요 내용:**
- ✅ 서버 시작 시 자동 로그인
- ✅ Selector 변경 대응 방법
- ✅ 에러 감지 및 복구 로직
- ✅ 트러블슈팅 가이드

---

### 3. [KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md)
**카카오 로그인 초기 설정 가이드**

- Playwright 기반 자동 로그인 설정 방법
- 환경 변수 설정 (.env 파일)
- Chromium 브라우저 설치
- 실행 방법 및 작동 과정
- 문제 해결 방법

**주요 내용:**
- 📦 사전 준비 및 패키지 설치
- ⚙️ 환경 설정 (.env 파일 생성)
- 🚀 실행 및 테스트
- 🔧 문제 해결 (6가지 주요 문제)

---

### 4. [GET-KAKAO-TOKEN.md](./GET-KAKAO-TOKEN.md)
**카카오 토큰 발급 가이드**

- 카카오 로그인을 자동화하는 3가지 방법
- OAuth 2.0 인증 플로우
- 토큰 발급 및 갱신 방법
- 서버 API 사용법

**주요 내용:**
- 🌐 브라우저 직접 인증 (가장 간단)
- 🤖 Playwright 완전 자동화
- 🔄 Refresh Token 자동 갱신
- 📋 토큰 파일 형식 및 관리

---

### 5. [AUTO-START-README.md](./AUTO-START-README.md)
**서버 자동 시작 및 통합 가이드**

- 서버 시작 시 자동 작업 수행
- 토큰 자동 로드 및 자동 로그인
- 전체 자동화 시나리오
- 구현 세부사항

**주요 내용:**
- ✅ 서버 시작 → 토큰 로드 → 자동 로그인 → 메시지 전송 가능
- 📁 파일 구조 및 아키텍처
- 🔧 Java 클래스 구현 설명
- 💡 자동화 시나리오 예시

---

## 🗂️ 문서 활용 가이드

### 처음 시작하는 경우
1. **[KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md)** - 초기 설정
2. **[GET-KAKAO-TOKEN.md](./GET-KAKAO-TOKEN.md)** - 토큰 발급 방법
3. **[AUTO-START-README.md](./AUTO-START-README.md)** - 서버 자동화 구성
4. **[SCHEDULER-GUIDE.md](./SCHEDULER-GUIDE.md)** - 정기 메시지 설정

### 문제가 발생한 경우
1. **[KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md)** - 트러블슈팅 및 에러 해결
2. **[KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md)** - 설정 관련 문제
3. **[SCHEDULER-GUIDE.md](./SCHEDULER-GUIDE.md)** - 스케줄러 문제 해결

### 구현 이해를 위한 경우
1. **[KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md)** - 전체 아키텍처 및 플로우
2. **[AUTO-START-README.md](./AUTO-START-README.md)** - 서버 통합 구현
3. **[SCHEDULER-GUIDE.md](./SCHEDULER-GUIDE.md)** - 스케줄러 아키텍처

---

## 📂 프로젝트 구조

```
CustomAutomation/
├── docs/                           # 📚 문서 디렉토리
│   ├── README.md                   # 이 파일
│   ├── SCHEDULER-GUIDE.md          # 정기 메시지 스케줄러 가이드
│   ├── KAKAO-AUTO-LOGIN-GUIDE.md   # 자동화 완벽 가이드
│   ├── KAKAO-LOGIN-SETUP.md        # 초기 설정 가이드
│   ├── GET-KAKAO-TOKEN.md          # 토큰 발급 가이드
│   └── AUTO-START-README.md        # 서버 자동 시작 가이드
│
├── scripts/                        # 🔧 스크립트 디렉토리
│   ├── kakao-auth-automation.js    # Playwright 자동화
│   ├── kakao-token-refresh.sh      # 토큰 갱신 스크립트
│   ├── run-kakao-login.sh          # 수동 로그인 스크립트
│   └── check-kakao-page.js         # 페이지 구조 확인
│
├── start-server.sh                 # 서버 시작 스크립트
│
├── .env.example                    # 환경변수 템플릿
├── .env                            # 환경변수 (gitignore)
│
├── src/                            # Java 소스 코드
│   └── main/
│       ├── java/jy/demo/
│       │   ├── controller/
│       │   │   ├── AuthController.java      # OAuth 콜백
│       │   │   └── MessageController.java   # 메시지 API
│       │   ├── service/
│       │   │   └── KakaoMsgServiceImpl.java # 토큰 관리
│       │   └── dto/
│       │       └── KakaoOAuthDto.java       # OAuth DTO
│       └── resources/
│           └── application.yml              # 설정 파일
│
└── logs/                           # 로그 디렉토리
    ├── application.log             # 서버 로그
    └── kakao-login.log             # 자동 로그인 로그
```

---

## 🔑 핵심 개념

### 자동화 플로우
```
서버 시작
  ↓
Health Check 완료
  ↓
auto_kakao_login() 실행
  ↓
.env 파일 검증
  ↓
Playwright로 카카오 로그인
  ↓
Authorization Code 추출
  ↓
서버 /kakao/callback 호출
  ↓
Access Token 발급 및 메모리 저장
  ↓
카카오톡 메시지 전송 가능 ✅
```

### 주요 파일 역할

| 파일 | 역할 | 언어 |
|------|------|------|
| `start-server.sh` | 서버 시작 및 자동 로그인 orchestration | Bash |
| `scripts/kakao-auth-automation.js` | Playwright 브라우저 자동화 | JavaScript |
| `scripts/kakao-token-refresh.sh` | Refresh Token으로 토큰 갱신 | Bash |
| `scripts/run-kakao-login.sh` | 대화형 수동 로그인 스크립트 | Bash |
| `scripts/check-kakao-page.js` | 카카오 페이지 구조 디버깅 도구 | JavaScript |
| `AuthController.java` | OAuth 콜백 처리 | Java |
| `KakaoMsgServiceImpl.java` | 토큰 관리 및 메시지 전송 | Java |
| `.env` | 카카오 계정 정보 (보안) | ENV |

---

## 🚀 빠른 시작

### 1. 환경 설정
```bash
cd CustomAutomation

# .env 파일 생성
cp .env.example .env
nano .env  # KAKAO_EMAIL, KAKAO_PASSWORD 입력

# Playwright 설치
npm install
npx playwright install chromium
```

### 2. 서버 시작
```bash
# 자동 로그인 포함 서버 시작
./start-server.sh start
```

### 3. 메시지 전송 테스트
```bash
curl -G "http://localhost:8081/message/send/kakaoMsg" \
  --data-urlencode "text=테스트 메시지"
```

**응답:** `메시지 전송에 성공했습니다.`

---

## 🔧 주요 명령어

### 서버 관리
```bash
./start-server.sh start     # 서버 시작 (자동 로그인)
./start-server.sh stop      # 서버 중지
./start-server.sh restart   # 서버 재시작
./start-server.sh status    # 서버 상태 확인
./start-server.sh logs      # 로그 실시간 보기
```

### 카카오 로그인
```bash
node scripts/kakao-auth-automation.js           # 자동 로그인
node scripts/kakao-auth-automation.js refresh   # 토큰 갱신
./scripts/run-kakao-login.sh                    # 대화형 로그인
./scripts/kakao-token-refresh.sh                # Refresh Token 갱신
```

### 디버깅
```bash
node scripts/check-kakao-page.js                # 페이지 구조 확인
tail -f logs/application.log            # 서버 로그
tail -f logs/kakao-login.log            # 로그인 로그
```

---

## ⚠️ 주의사항

### 보안
- ✅ `.env` 파일은 절대 Git에 커밋하지 마세요 (.gitignore에 포함됨)
- ✅ 파일 권한 설정: `chmod 600 .env`
- ✅ 프로덕션에서는 시스템 환경변수 사용 권장

### 토큰 관리
- 🔄 Access Token은 메모리에만 저장 (서버 재시작 시 손실)
- 🔄 Refresh Token으로 주기적 갱신 필요 (약 6시간마다)
- 🔄 서버 재시작 시 자동 로그인으로 재발급

### 카카오 개발자 설정
- 📋 Redirect URI 등록 필수: `http://southoftheriver.synology.me:8081/kakao/callback`
- 📋 동의 항목 활성화: `talk_message`
- ⚠️ `profile` 동의 항목 미설정 시 KOE205 에러 발생 (현재는 scope에서 제외됨)

---

## 📞 문제 해결

### 자주 발생하는 에러

| 에러 코드 | 원인 | 해결 방법 | 문서 참조 |
|----------|------|----------|----------|
| KOE205 | 동의 항목 미설정 | scope에서 profile 제거 | [KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md#koe205-잘못된-요청---동의-항목-오류) |
| KOE320 | Authorization Code 만료 | 재로그인 | [KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md#koe320-authorization-code-만료) |
| Selector 오류 | 페이지 구조 변경 | check-kakao-page.js로 확인 | [KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md#문제-2-selector를-찾을-수-없음) |
| Playwright 미설치 | 브라우저 없음 | npx playwright install chromium | [KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md#3-playwright-브라우저-설치) |

---

## 📖 추가 리소스

### 공식 문서
- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오톡 메시지 API](https://developers.kakao.com/docs/latest/ko/message/rest-api)
- [Playwright 공식 문서](https://playwright.dev/)

### 프로젝트 루트 문서
- [../CLAUDE.md](../CLAUDE.md) - 프로젝트 전체 가이드
- [../README.md](../README.md) - 프로젝트 소개

---

## 🔄 문서 업데이트 이력

### 2025-12-04
- ✅ 모든 문서를 docs/ 디렉토리로 통합
- ✅ README.md 추가 (이 파일)
- ✅ KAKAO-AUTO-LOGIN-GUIDE.md 완성
- ✅ KOE205 에러 해결 방법 추가
- ✅ Selector 변경 대응 완료

### 2025-11-07
- ✅ 초기 문서 작성
- ✅ 자동화 구현 완료

---

**문서 작성일:** 2025-12-04
**마지막 업데이트:** 2025-12-04
**작성자:** Claude Code with CustomAutomation Team
