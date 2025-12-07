# 서버 자동 시작 및 카카오 자동 로그인 가이드

## 개요

CustomAutomation 서버를 시작하면 자동으로 다음 작업이 수행됩니다:

1. ✅ **서버 시작** - Spring Boot 애플리케이션 실행
2. ✅ **토큰 자동 로드** - `kakao-tokens.json` 파일에서 카카오 토큰 자동 로드
3. ✅ **카카오 자동 로그인** - `.env` 파일이 있으면 Playwright로 자동 로그인 실행
4. ✅ **토큰 자동 저장** - 로그인 성공 시 토큰을 파일에 저장

## 빠른 시작

### 1단계: .env 파일 생성 (선택사항)
```bash
cd CustomAutomation
cp .env.example .env
nano .env
```

**.env 파일 내용:**
```
KAKAO_EMAIL=your-email@example.com
KAKAO_PASSWORD=your-password
```

### 2단계: 서버 시작
```bash
./start-server.sh start
```

## 작동 과정

### 시나리오 1: .env 파일이 있고, 토큰 파일도 있는 경우

```
1. 서버 시작
2. kakao-tokens.json에서 토큰 자동 로드 ✓
3. 토큰 갱신 시도 (refresh token 사용)
   - 성공하면 종료
   - 실패하면 재로그인 시도
4. 카카오톡 메시지 전송 가능 상태
```

### 시나리오 2: .env 파일이 있지만, 토큰 파일이 없는 경우

```
1. 서버 시작
2. 토큰 파일 없음 (건너뜀)
3. Playwright로 카카오 자동 로그인 실행
4. Authorization Code 추출
5. Access Token 발급
6. kakao-tokens.json 파일에 저장
7. 서버의 메모리에도 토큰 로드
8. 카카오톡 메시지 전송 가능 상태
```

### 시나리오 3: .env 파일이 없는 경우

```
1. 서버 시작
2. kakao-tokens.json 파일이 있으면 토큰 자동 로드 ✓
3. 카카오 자동 로그인 건너뜀
4. (토큰이 있으면) 카카오톡 메시지 전송 가능 상태
```

## 서버 로그 확인

### 토큰 자동 로드 성공
```
INFO  - 카카오 토큰 자동 로드 시작...
INFO  - 카카오 토큰을 파일에서 로드했습니다.
INFO  - ✓ 카카오 토큰을 파일에서 로드했습니다.
INFO  -   - Access Token: xyz789...
INFO  -   - 카카오톡 메시지 전송 준비 완료!
```

### 토큰 파일이 없는 경우
```
INFO  - 카카오 토큰 자동 로드 시작...
INFO  - 카카오 토큰 파일이 존재하지 않습니다: kakao-tokens.json
WARN  - ⚠ 카카오 토큰 파일이 없거나 유효하지 않습니다.
INFO  - 카카오 로그인을 수행하려면 다음 중 하나를 실행하세요:
INFO  -   1. ./run-kakao-login.sh
INFO  -   2. 브라우저에서 카카오 인증 URL 접속
```

### 자동 로그인 성공
```
=== Kakao Auto Login ===
카카오 자동 로그인 실행 중...
✓ 카카오 자동 로그인 성공
토큰 저장 위치: /path/to/kakao-tokens.json
```

### 자동 로그인 건너뜀
```
=== Kakao Auto Login ===
⚠ .env 파일이 없습니다. 카카오 자동 로그인을 건너뜁니다.
카카오 로그인을 사용하려면 .env 파일을 생성하세요:
  cp .env.example .env && nano .env
```

## 구현 세부사항

### 1. Bash 스크립트 (`start-server.sh`)

서버 시작 스크립트에 `auto_kakao_login()` 함수가 추가되었습니다:

**기능:**
- `.env` 파일 존재 여부 확인
- 카카오 계정 정보 유효성 검사
- 기존 토큰 파일이 있으면 갱신 시도
- 없거나 갱신 실패 시 재로그인 실행
- 60초 timeout 설정

### 2. Java 클래스

#### KakaoTokenDto.java
```java
// 토큰 정보를 담는 DTO
@JsonProperty("access_token")
private String accessToken;

@JsonProperty("refresh_token")
private String refreshToken;
```

#### KakaoTokenFileManager.java
```java
@Component
public class KakaoTokenFileManager {
    // 토큰 파일 읽기/쓰기
    public KakaoTokenDto loadToken()
    public boolean saveToken(String accessToken, String refreshToken)
    public boolean saveToken(KakaoTokenDto token)
    public boolean tokenFileExists()
    public boolean deleteToken()
}
```

#### KakaoMsgServiceImpl.java
```java
@PostConstruct
public void init() {
    // 서버 시작 시 자동 실행
    KakaoTokenDto token = tokenFileManager.loadToken();
    if (token != null) {
        this.accessToken = token.getAccessToken();
        this.refrashToken = token.getRefreshToken();
    }
}

public boolean requestAccessToken(String code) {
    // 토큰 발급 후 자동 저장
    tokenFileManager.saveToken(accessToken, refrashToken);
}
```

## 파일 구조

```
CustomAutomation/
├── start-server.sh               # 서버 시작 스크립트 (자동 로그인 포함)
├── run-kakao-login.sh            # 수동 카카오 로그인 스크립트
├── kakao-auth-automation.js      # Playwright 자동화 스크립트
├── kakao-token-refresh.sh        # 토큰 갱신 스크립트
├── .env                          # 카카오 계정 정보 (gitignore)
├── .env.example                  # 환경변수 템플릿
├── kakao-tokens.json             # 토큰 저장 파일 (gitignore)
├── logs/
│   ├── application.log           # 서버 로그
│   └── kakao-login.log           # 카카오 로그인 로그
└── src/main/java/jy/demo/
    ├── dto/
    │   └── KakaoTokenDto.java    # 토큰 DTO
    ├── util/
    │   └── KakaoTokenFileManager.java  # 토큰 파일 관리
    └── service/
        └── KakaoMsgServiceImpl.java    # 카카오 메시지 서비스
```

## 명령어 요약

### 서버 관리
```bash
# 서버 시작 (자동 로그인 포함)
./start-server.sh start

# 서버 중지
./start-server.sh stop

# 서버 재시작
./start-server.sh restart

# 서버 상태 확인
./start-server.sh status

# 로그 확인
./start-server.sh logs
```

### 카카오 로그인
```bash
# 수동 로그인 (대화형)
./run-kakao-login.sh

# 직접 자동화 스크립트 실행
node kakao-auth-automation.js

# 토큰 갱신
node kakao-auth-automation.js refresh
# 또는
./kakao-token-refresh.sh
```

### 메시지 전송 테스트
```bash
curl -X POST http://localhost:8081/message/send \
  -H "Content-Type: application/json" \
  -d '{"text": "테스트 메시지"}'
```

## 자동화 시나리오 예시

### 예시 1: 완전 자동화 (최초 실행)
```bash
# 1. .env 파일 생성
cat > .env << 'EOF'
KAKAO_EMAIL=myemail@example.com
KAKAO_PASSWORD=mypassword
EOF

# 2. 서버 시작
./start-server.sh start

# 결과:
# - 서버 시작
# - Playwright가 자동으로 카카오 로그인
# - 토큰 발급 및 저장
# - 메시지 전송 가능 상태
```

### 예시 2: 서버 재시작 (토큰이 이미 있는 경우)
```bash
# 서버 재시작
./start-server.sh restart

# 결과:
# - 서버 시작
# - kakao-tokens.json에서 토큰 자동 로드
# - 토큰 갱신 시도
# - 메시지 전송 가능 상태
```

### 예시 3: 토큰 만료 후 자동 갱신
```bash
# Cron 설정 (매 5시간마다)
crontab -e

# 추가:
0 */5 * * * cd /path/to/CustomAutomation && ./kakao-token-refresh.sh

# 또는 서버 재시작 시 자동 처리
./start-server.sh restart
```

## 트러블슈팅

### 1. 자동 로그인이 실행되지 않음
**확인사항:**
- `.env` 파일이 있는지 확인
- `.env` 파일에 KAKAO_EMAIL, KAKAO_PASSWORD가 설정되어 있는지 확인
- `node_modules/playwright`가 설치되어 있는지 확인

**해결:**
```bash
# .env 파일 확인
cat .env

# Playwright 재설치
npm install playwright
npx playwright install chromium
```

### 2. 토큰이 로드되지 않음
**확인사항:**
- `kakao-tokens.json` 파일이 있는지 확인
- JSON 형식이 올바른지 확인

**해결:**
```bash
# 토큰 파일 확인
cat kakao-tokens.json

# 토큰 파일 재생성
rm kakao-tokens.json
./run-kakao-login.sh
```

### 3. 서버 시작 후 토큰이 메모리에 없음
**확인사항:**
- 서버 로그에서 "카카오 토큰 자동 로드" 메시지 확인
- `kakao-tokens.json` 파일의 access_token 필드 확인

**해결:**
```bash
# 로그 확인
tail -f logs/application.log | grep 카카오

# 서버 재시작
./start-server.sh restart
```

### 4. Playwright timeout 에러
**원인:** 60초 안에 로그인 완료되지 않음

**해결:**
```bash
# start-server.sh의 timeout 값 증가
# 149번째 줄 수정:
timeout 120s node kakao-auth-automation.js

# 또는 수동 로그인
./run-kakao-login.sh
```

## 보안 권장사항

### 1. 파일 권한 설정
```bash
# .env 파일 권한 (소유자만 읽기/쓰기)
chmod 600 .env

# 토큰 파일 권한
chmod 600 kakao-tokens.json
```

### 2. Git 제외
`.gitignore`에 이미 추가되어 있습니다:
```
.env
kakao-tokens.json
logs/
```

### 3. 프로덕션 환경
프로덕션에서는 다음을 권장합니다:
- 환경변수를 시스템 레벨에서 관리
- 토큰을 암호화된 스토리지에 저장
- Refresh Token으로 정기적으로 갱신
- 로그에서 민감한 정보 마스킹

## 추가 개선 사항 (향후)

1. **토큰 자동 갱신 스케줄러**
   - Spring `@Scheduled`를 사용해 5시간마다 자동 갱신

2. **토큰 만료 체크**
   - 메시지 전송 실패 시 자동으로 토큰 갱신 시도

3. **Health Check 엔드포인트**
   - `/actuator/kakao/health` - 토큰 상태 확인

4. **토큰 암호화**
   - 파일에 저장 시 AES 암호화 적용

5. **로그 회전**
   - 오래된 로그 자동 삭제

## 참고 자료

- [KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md) - 상세 설정 가이드
- [GET-KAKAO-TOKEN.md](./GET-KAKAO-TOKEN.md) - 토큰 발급 방법
- [카카오 개발자 문서](https://developers.kakao.com/)
