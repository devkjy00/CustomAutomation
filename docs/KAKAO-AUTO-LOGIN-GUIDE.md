# 카카오 로그인 자동화 완벽 가이드

## 📋 목차
1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [자동화 플로우](#자동화-플로우)
4. [설정 및 설치](#설정-및-설치)
5. [트러블슈팅](#트러블슈팅)
6. [에러 코드 및 해결방법](#에러-코드-및-해결방법)
7. [보안 고려사항](#보안-고려사항)

---

## 개요

CustomAutomation 서버는 Playwright를 사용하여 카카오 로그인을 자동화합니다. 서버 시작 시 자동으로 카카오 로그인을 수행하고, Access Token을 발급받아 카카오톡 메시지 전송 기능을 즉시 사용할 수 있도록 합니다.

### 주요 기능
- ✅ 서버 시작 시 자동 로그인
- ✅ Playwright 브라우저 자동화
- ✅ 카카오 OAuth 2.0 인증
- ✅ Access Token 자동 발급
- ✅ 에러 감지 및 복구

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  서버 시작 (start-server.sh)             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│            Spring Boot 애플리케이션 시작                 │
│              (Port 8081, Health Check)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              auto_kakao_login() 함수 호출                │
│          (start-server.sh의 자동 실행 로직)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│          .env 파일 존재 여부 확인                        │
│     KAKAO_EMAIL / KAKAO_PASSWORD 검증                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│     node kakao-auth-automation.js 실행                  │
│         (Playwright 자동화 스크립트)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Playwright Chromium 브라우저                │
│         카카오 로그인 페이지 자동 조작                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Authorization Code 추출                         │
│      (리다이렉트 URL 파라미터에서 code 획득)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│       서버 /kakao/callback 엔드포인트 호출               │
│      (Authorization Code → Access Token)                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│    KakaoMsgServiceImpl의 accessToken 메모리 저장        │
│         카카오톡 메시지 전송 준비 완료                    │
└─────────────────────────────────────────────────────────┘
```

---

## 자동화 플로우

### 1단계: 서버 시작 및 체크

**파일:** `start-server.sh`

```bash
# 서버 시작
./gradlew bootRun &

# Health Check 대기 (최대 60초)
for i in {1..30}; do
    if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
        echo "✓ Server is UP"
        auto_kakao_login  # 자동 로그인 함수 호출
        break
    fi
    sleep 2
done
```

**주요 동작:**
- Spring Boot 애플리케이션 백그라운드 실행
- Health endpoint 확인
- 서버 정상 시작 확인 후 자동 로그인 실행

---

### 2단계: 환경 검증

**파일:** `start-server.sh` - `auto_kakao_login()` 함수

```bash
auto_kakao_login() {
    # .env 파일 존재 확인
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo "⚠ .env 파일이 없습니다."
        return 0
    fi

    # 환경변수 로드
    source "$PROJECT_DIR/.env"

    # 계정 정보 검증
    if [ -z "$KAKAO_EMAIL" ] || [ -z "$KAKAO_PASSWORD" ]; then
        echo "⚠ KAKAO_EMAIL/PASSWORD 미설정"
        return 0
    fi

    # Playwright 자동화 실행
    timeout 60s node kakao-auth-automation.js
}
```

**검증 항목:**
1. `.env` 파일 존재 여부
2. `KAKAO_EMAIL` 환경변수 설정
3. `KAKAO_PASSWORD` 환경변수 설정
4. `node_modules/playwright` 설치 여부

---

### 3단계: Playwright 자동화

**파일:** `kakao-auth-automation.js`

#### 3-1. 환경 설정

```javascript
require('dotenv').config();
const { chromium } = require('playwright');

const CONFIG = {
    CLIENT_ID: '620c9095c04cad076902cde3e1237d7a',
    REDIRECT_URI: 'http://southoftheriver.synology.me:8081/kakao/callback',
    KAKAO_EMAIL: process.env.KAKAO_EMAIL,
    KAKAO_PASSWORD: process.env.KAKAO_PASSWORD,
    TOKEN_FILE: './kakao-tokens.json'
};
```

**중요 설정:**
- `CLIENT_ID`: 카카오 앱 키 (application.yml과 동일)
- `REDIRECT_URI`: OAuth 리다이렉트 URL (서버 엔드포인트)
- `scope`: `talk_message` (profile 제외 - KOE205 에러 방지)

#### 3-2. 인증 URL 생성

```javascript
function buildAuthUrl() {
    const params = new URLSearchParams({
        client_id: CONFIG.CLIENT_ID,
        redirect_uri: CONFIG.REDIRECT_URI,
        response_type: 'code',
        scope: 'talk_message'  // profile은 동의항목 미설정으로 제외
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}
```

**생성 URL 예시:**
```
https://kauth.kakao.com/oauth/authorize?
  client_id=620c9095c04cad076902cde3e1237d7a
  &redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback
  &response_type=code
  &scope=talk_message
```

#### 3-3. 브라우저 자동화

```javascript
const browser = await chromium.launch({
    headless: false  // 디버깅을 위해 브라우저 표시
});

const context = await browser.newContext();
const page = await context.newPage();

// 1. 카카오 인증 페이지로 이동
await page.goto(authUrl, { waitUntil: 'networkidle' });

// 2. 로그인 페이지 대기 (변경된 selector)
await page.waitForSelector('input[name="loginId"]', { timeout: 10000 });

// 3. 로그인 정보 입력
await page.fill('input[name="loginId"]', CONFIG.KAKAO_EMAIL);
await page.fill('input[name="password"]', CONFIG.KAKAO_PASSWORD);

// 4. 로그인 버튼 클릭
const navigationPromise = page.waitForNavigation({ timeout: 10000 });
await page.click('button[type="submit"]');
await navigationPromise;
```

**Selector 변경 이력:**
| 이전 | 현재 | 이유 |
|------|------|------|
| `input[name="email"]` | `input[name="loginId"]` | 카카오 페이지 구조 변경 |
| `input[type="email"]` | `input[name="loginId"]` | 통합 로그인 필드로 변경 |

#### 3-4. 에러 감지

```javascript
// 에러 메시지 확인
const errorElement = await page.$('.error_txt, .txt_error, [class*="error"]');
if (errorElement) {
    const errorText = await errorElement.textContent();
    console.error('❌ 카카오 에러 발생:', errorText);
    await page.screenshot({ path: 'kakao-error.png' });
}

// KOE 에러 코드 감지
const pageContent = await page.content();
if (pageContent.includes('KOE')) {
    const errorMatch = pageContent.match(/KOE\d+/);
    if (errorMatch) {
        console.error(`❌ 카카오 에러 코드: ${errorMatch[0]}`);
    }
}
```

#### 3-5. Authorization Code 추출

```javascript
// URL에 code 파라미터가 포함될 때까지 대기
let currentUrl = page.url();

// code가 없으면 추가 대기
if (!currentUrl.includes('code=')) {
    await page.waitForTimeout(3000);
    currentUrl = page.url();
}

// code 파라미터 추출
const urlParams = new URLSearchParams(new URL(currentUrl).search);
const authCode = urlParams.get('code');

console.log(`✓ Authorization Code: ${authCode.substring(0, 20)}...`);
```

**예시 Redirect URL:**
```
http://southoftheriver.synology.me:8081/kakao/callback?code=uiCWvTU2EZlNYPVMhAeq...
```

---

### 4단계: 서버 콜백 처리

**파일:** `AuthController.java`

```java
@GetMapping("/kakao/callback")
public String kakao(@RequestParam("code") String code) {
    kakaoMsgServiceImpl.requestAccessToken(code);
    return "kakao";
}
```

**파일:** `KakaoMsgServiceImpl.java`

```java
public boolean requestAccessToken(String code) {
    KakaoOAuthDto body = new KakaoOAuthDto(code, clientId);

    try {
        // 카카오 토큰 발급 API 호출
        String response = apiClient.post(
            AUTH_URL,
            JsonUtil.toJson(JsonUtil.toMap(body)),
            JsonUtil.toJson(apiClient.generateUrlEncodedHeader())
        );

        Map<String, Object> result = JsonUtil.toMap(response);

        // Access Token 메모리 저장
        accessToken = result.get("access_token").toString();
        refrashToken = result.get("refresh_token").toString();

        return true;
    } catch(Exception e) {
        return false;
    }
}
```

**토큰 발급 API:**
```
POST https://kauth.kakao.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=620c9095c04cad076902cde3e1237d7a
&redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback
&code={authorization_code}
```

**응답 예시:**
```json
{
  "access_token": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "token_type": "bearer",
  "refresh_token": "yyyyyyyyyyyyyyyyyyyyyyyy",
  "expires_in": 21599,
  "refresh_token_expires_in": 5183999
}
```

---

## 설정 및 설치

### 1. 사전 준비

```bash
cd CustomAutomation

# Node.js 패키지 설치
npm install

# Playwright Chromium 브라우저 설치
npx playwright install chromium
```

### 2. 환경 변수 설정

**.env 파일 생성:**
```bash
cp .env.example .env
nano .env
```

**.env 파일 내용:**
```env
KAKAO_EMAIL=your-email@example.com
KAKAO_PASSWORD=your-password
```

**보안 설정:**
```bash
# 파일 권한 설정 (소유자만 읽기/쓰기)
chmod 600 .env
```

### 3. 카카오 개발자 설정

**필수 설정 항목:**

1. **Redirect URI 등록**
   - 위치: https://developers.kakao.com/ > 내 애플리케이션 > 앱 설정 > 플랫폼
   - 값: `http://southoftheriver.synology.me:8081/kakao/callback`

2. **동의 항목 설정**
   - 위치: 제품 설정 > 카카오 로그인 > 동의항목
   - 필수: `talk_message` (카카오톡 메시지 전송)
   - 선택: `profile` (프로필 정보 - 현재 미사용)

3. **활성화 설정**
   - 카카오 로그인: ON
   - 카카오톡 메시지: ON

### 4. 서버 시작

```bash
# 서버 시작 (자동 로그인 포함)
./start-server.sh start

# 서버 상태 확인
./start-server.sh status

# 로그 확인
tail -f logs/application.log
tail -f logs/kakao-login.log
```

---

## 트러블슈팅

### 문제 1: Playwright 브라우저 미설치

**증상:**
```
browserType.launch: Executable doesn't exist at /Users/.../chrome-mac-arm64/...
```

**해결:**
```bash
npx playwright install chromium
```

### 문제 2: Selector를 찾을 수 없음

**증상:**
```
page.waitForSelector: Timeout 10000ms exceeded.
waiting for locator('input[name="email"]') to be visible
```

**원인:** 카카오 로그인 페이지 구조 변경

**해결:** `check-kakao-page.js`로 실제 페이지 구조 확인

```bash
node check-kakao-page.js
```

**현재 올바른 Selector:**
- 이메일 입력: `input[name="loginId"]`
- 비밀번호 입력: `input[name="password"]`
- 로그인 버튼: `button[type="submit"]`

### 문제 3: .env 파일 없음

**증상:**
```
⚠ .env 파일이 없습니다. 카카오 자동 로그인을 건너뜁니다.
```

**해결:**
```bash
cp .env.example .env
nano .env
# KAKAO_EMAIL과 KAKAO_PASSWORD 입력
```

### 문제 4: 환경변수 미설정

**증상:**
```
❌ KAKAO_EMAIL 또는 KAKAO_PASSWORD 환경변수가 설정되지 않았습니다.
```

**해결:**
```bash
# .env 파일 확인
cat .env

# 환경변수가 비어있지 않은지 확인
source .env
echo $KAKAO_EMAIL
echo $KAKAO_PASSWORD
```

### 문제 5: 서버 미실행

**증상:**
```
⚠ CustomAutomation 서버가 실행되지 않았습니다.
```

**해결:**
```bash
# 서버 먼저 시작
./start-server.sh start

# 또는 수동으로 Gradle 실행
./gradlew bootRun
```

---

## 에러 코드 및 해결방법

### KOE205: 잘못된 요청 - 동의 항목 오류

**전체 에러 메시지:**
```
잘못된 요청 (KOE205)
서비스 설정에 오류가 있어, 이용할 수 없습니다.
설정하지 않은 동의 항목: profile
```

**원인:**
- OAuth 요청 scope에 `profile`이 포함되어 있음
- 카카오 개발자 콘솔에서 `profile` 동의 항목 미설정

**해결 방법 1: 동의 항목 추가 (권장)**
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 > CustomAutomation
3. 제품 설정 > 카카오 로그인 > 동의항목
4. `profile` 동의 항목 추가 및 활성화

**해결 방법 2: Scope 수정 (현재 적용)**
```javascript
// kakao-auth-automation.js
function buildAuthUrl() {
    const params = new URLSearchParams({
        // ...
        scope: 'talk_message'  // profile 제거
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}
```

### KOE320: Authorization Code 만료

**에러 메시지:**
```
error: 'invalid_grant'
error_description: 'authorization code not found for code=...'
error_code: 'KOE320'
```

**원인:**
- Authorization Code는 1회용
- 서버의 `/kakao/callback`이 이미 code를 사용함
- 스크립트에서 중복으로 사용 시도

**해결:**
- 정상 동작입니다.
- 서버가 토큰을 받았으므로 스크립트는 code 추출만 하고 종료
- 토큰은 서버 메모리에 저장됨

**확인:**
```bash
curl -G "http://localhost:8081/message/send/kakaoMsg" \
  --data-urlencode "text=테스트"
```

응답: `메시지 전송에 성공했습니다.`

### KOE303: 리프레시 토큰 만료

**에러 메시지:**
```
error: 'invalid_grant'
error_description: 'refresh token has expired'
error_code: 'KOE303'
```

**원인:**
- Refresh Token 만료 (약 2개월)

**해결:**
```bash
# 재로그인
./start-server.sh restart

# 또는 수동 로그인
node kakao-auth-automation.js
```

### 네트워크 타임아웃

**증상:**
```
page.waitForNavigation: Timeout 10000ms exceeded
```

**원인:**
- 네트워크 느림
- 카카오 서버 응답 지연

**해결:**
```javascript
// timeout 증가
await page.waitForNavigation({ timeout: 30000 });

// 또는 네트워크 안정 시까지 대기
await page.goto(authUrl, { waitUntil: 'networkidle' });
```

---

## 보안 고려사항

### 1. .env 파일 보호

```bash
# 파일 권한 설정
chmod 600 .env

# Git에서 제외 (.gitignore에 이미 추가됨)
echo ".env" >> .gitignore
```

### 2. 비밀번호 대안

**환경변수 사용 (프로덕션 권장):**
```bash
# 시스템 레벨 환경변수
export KAKAO_EMAIL="email@example.com"
export KAKAO_PASSWORD="password"

# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'export KAKAO_EMAIL="email@example.com"' >> ~/.bashrc
echo 'export KAKAO_PASSWORD="password"' >> ~/.bashrc
source ~/.bashrc
```

**Docker Secrets 사용:**
```yaml
# docker-compose.yml
services:
  customautomation:
    environment:
      KAKAO_EMAIL: ${KAKAO_EMAIL}
      KAKAO_PASSWORD: ${KAKAO_PASSWORD}
    secrets:
      - kakao_email
      - kakao_password
```

### 3. 토큰 보안

**현재 상태:**
- Access Token은 메모리에만 저장
- 서버 재시작 시 토큰 손실 → 재로그인 필요

**개선 방안:**
- 토큰을 암호화하여 파일에 저장
- Redis 같은 캐시에 저장
- Refresh Token으로 자동 갱신

### 4. 로그 마스킹

```javascript
// 민감한 정보 마스킹
console.log(`Email: ${CONFIG.KAKAO_EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2')}`);
console.log(`Password: ${'*'.repeat(CONFIG.KAKAO_PASSWORD.length)}`);
console.log(`Access Token: ${accessToken.substring(0, 10)}...`);
```

### 5. HTTPS 사용

**프로덕션 환경:**
```
https://your-domain.com:8081/kakao/callback
```

**개발 환경 (현재):**
```
http://southoftheriver.synology.me:8081/kakao/callback
```

---

## 디버깅 팁

### 1. 브라우저 표시 모드

```javascript
// kakao-auth-automation.js
const browser = await chromium.launch({
    headless: false,  // 브라우저 보이기
    slowMo: 100       // 동작 속도 느리게 (디버깅)
});
```

### 2. 스크린샷 저장

```javascript
// 에러 발생 시 자동 저장
await page.screenshot({ path: 'kakao-error.png' });

// 각 단계별 스크린샷
await page.screenshot({ path: `step-${stepNumber}.png` });
```

### 3. 로그 레벨 조정

```bash
# 상세 로그 출력
DEBUG=pw:api node kakao-auth-automation.js

# Playwright trace 기록
node kakao-auth-automation.js --trace on
```

### 4. 페이지 소스 확인

```javascript
// 현재 페이지 HTML 출력
const html = await page.content();
console.log(html);

// 특정 요소 확인
const element = await page.$('input[name="loginId"]');
console.log(await element.evaluate(el => ({
    id: el.id,
    name: el.name,
    type: el.type
})));
```

---

## 참고 자료

### 공식 문서
- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오톡 메시지 API](https://developers.kakao.com/docs/latest/ko/message/rest-api)
- [Playwright 문서](https://playwright.dev/)

### 관련 파일
- `start-server.sh` - 서버 시작 및 자동 로그인 orchestration
- `kakao-auth-automation.js` - Playwright 자동화 스크립트
- `check-kakao-page.js` - 페이지 구조 확인 도구
- `AuthController.java` - OAuth 콜백 처리
- `KakaoMsgServiceImpl.java` - 토큰 관리 및 메시지 전송

### 추가 가이드
- [KAKAO-LOGIN-SETUP.md](./KAKAO-LOGIN-SETUP.md) - 상세 설정 가이드
- [AUTO-START-README.md](./AUTO-START-README.md) - 서버 자동 시작 가이드
- [GET-KAKAO-TOKEN.md](./GET-KAKAO-TOKEN.md) - 토큰 발급 방법

---

## 버전 이력

### v1.1 (2025-12-04)
- ✅ KOE205 에러 해결 (scope에서 profile 제거)
- ✅ Selector 변경 대응 (`loginId` 사용)
- ✅ 에러 감지 로직 추가
- ✅ 스크린샷 자동 저장

### v1.0 (2025-11-07)
- ✅ 최초 자동화 구현
- ✅ Playwright 통합
- ✅ 서버 시작 스크립트 연동
