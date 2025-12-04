# CustomAutomation Scripts

이 디렉토리에는 카카오 로그인 자동화 및 관련 유틸리티 스크립트가 포함되어 있습니다.

## 📜 스크립트 목록

### 1. kakao-auth-automation.js
**Playwright 기반 카카오 로그인 자동화 스크립트**

브라우저를 자동으로 제어하여 카카오 로그인을 수행하고 OAuth 토큰을 발급받습니다.

#### 사용법
```bash
# 자동 로그인 (새로운 토큰 발급)
node scripts/kakao-auth-automation.js

# Refresh Token으로 토큰 갱신
node scripts/kakao-auth-automation.js refresh
```

#### 작동 과정
1. `.env` 파일에서 `KAKAO_EMAIL`, `KAKAO_PASSWORD` 로드
2. Playwright Chromium 브라우저 실행
3. 카카오 인증 페이지로 이동
4. 로그인 정보 자동 입력 및 제출
5. Authorization Code 추출
6. Access Token 및 Refresh Token 발급
7. `kakao-tokens.json` 파일에 저장
8. 서버 `/kakao/callback` 엔드포인트 호출

#### 필수 조건
- `.env` 파일 설정 (KAKAO_EMAIL, KAKAO_PASSWORD)
- Playwright Chromium 설치: `npx playwright install chromium`
- Node.js 패키지 설치: `npm install`

#### 출력 파일
- `kakao-tokens.json` - 발급받은 토큰 정보
- `kakao-error.png` - 에러 발생 시 스크린샷

---

### 2. kakao-token-refresh.sh
**Refresh Token을 사용한 자동 토큰 갱신 스크립트**

저장된 Refresh Token을 사용하여 브라우저 없이 새로운 Access Token을 발급받습니다.

#### 사용법
```bash
./scripts/kakao-token-refresh.sh
```

#### 작동 과정
1. `kakao-tokens.json` 파일에서 Refresh Token 로드
2. 카카오 OAuth API에 토큰 갱신 요청
3. 새로운 Access Token 발급
4. `kakao-tokens.json` 파일 업데이트

#### 필수 조건
- `kakao-tokens.json` 파일 존재 (이전 로그인 이력)
- Refresh Token이 만료되지 않았을 것 (약 6개월 유효)

#### 장점
- 브라우저 없이 빠른 토큰 갱신
- Playwright 불필요
- 백그라운드 자동화에 적합

---

### 3. run-kakao-login.sh
**대화형 카카오 로그인 스크립트**

사용자와 상호작용하면서 안내에 따라 로그인을 수행하는 스크립트입니다.

#### 사용법
```bash
./scripts/run-kakao-login.sh
```

#### 작동 과정
1. 카카오 인증 URL을 브라우저에서 자동으로 열기
2. 사용자가 직접 로그인 수행
3. Redirect된 URL을 복사하여 입력
4. Authorization Code 추출 및 토큰 발급
5. `kakao-tokens.json` 파일에 저장

#### 필수 조건
- 웹 브라우저 (자동으로 열림)
- 카카오 계정

#### 장점
- Playwright 불필요
- 환경변수에 비밀번호 저장 불필요
- 수동 제어 가능

---

### 4. check-kakao-page.js
**카카오 로그인 페이지 구조 확인 디버깅 도구**

카카오 로그인 페이지의 HTML 구조와 입력 필드를 분석하는 도구입니다.

#### 사용법
```bash
node scripts/check-kakao-page.js
```

#### 작동 과정
1. Playwright로 카카오 인증 페이지 열기
2. 페이지 HTML 소스 출력 (처음 2000자)
3. 다양한 selector로 입력 필드 검색
4. 모든 input 요소의 속성 출력
5. 브라우저를 30초간 열어두고 수동 확인 가능

#### 사용 시나리오
- 카카오 페이지 구조가 변경되었을 때
- Selector 오류 발생 시
- 새로운 자동화 로직 개발 시

#### 출력 정보
```
=== 페이지 소스 ===
<html>...</html>

=== 입력 필드 검색 ===
✓ 찾음: input[name="loginId"]
  속성: {
    "id": "",
    "name": "loginId",
    "type": "text",
    "placeholder": "카카오계정 (이메일 또는 전화번호)",
    "className": "tf_g"
  }

=== 모든 input 요소 ===
총 5개의 input 발견
Input 1: {...}
Input 2: {...}
...
```

---

## 🔧 일반적인 사용 시나리오

### 시나리오 1: 최초 로그인
```bash
# 1. 환경변수 설정
cp .env.example .env
nano .env  # KAKAO_EMAIL, KAKAO_PASSWORD 입력

# 2. 패키지 설치
npm install
npx playwright install chromium

# 3. 자동 로그인 실행
node scripts/kakao-auth-automation.js
```

### 시나리오 2: 토큰 갱신
```bash
# Refresh Token이 있을 때 (빠른 방법)
./scripts/kakao-token-refresh.sh

# 또는 Playwright로 재로그인
node scripts/kakao-auth-automation.js
```

### 시나리오 3: 수동 로그인 (환경변수 없이)
```bash
./scripts/run-kakao-login.sh
```

### 시나리오 4: 에러 디버깅
```bash
# 1. 페이지 구조 확인
node scripts/check-kakao-page.js

# 2. 로그 확인
tail -f ../logs/kakao-login.log

# 3. 에러 스크린샷 확인
open ../kakao-error.png
```

---

## ⚙️ 환경 설정

### .env 파일 (프로젝트 루트)
```env
KAKAO_EMAIL=your-email@example.com
KAKAO_PASSWORD=your-password
```

### 필수 패키지
```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "playwright": "^1.40.0"
  }
}
```

---

## 🔍 트러블슈팅

### 문제 1: "Executable doesn't exist" 오류
**원인**: Playwright 브라우저 미설치
```bash
npx playwright install chromium
```

### 문제 2: "Selector timeout" 오류
**원인**: 카카오 페이지 구조 변경
```bash
# 페이지 구조 확인
node scripts/check-kakao-page.js

# kakao-auth-automation.js에서 selector 수정
# 예: input[name="loginId"] → 새로운 selector
```

### 문제 3: KOE205 에러
**원인**: 동의 항목 미설정
```javascript
// kakao-auth-automation.js에서 scope 확인
scope: 'talk_message'  // profile은 제외
```

### 문제 4: "refresh token not found"
**원인**: Refresh Token 만료
```bash
# 새로 로그인 필요
node scripts/kakao-auth-automation.js
```

---

## 📚 관련 문서

- [../docs/KAKAO-AUTO-LOGIN-GUIDE.md](../docs/KAKAO-AUTO-LOGIN-GUIDE.md) - 자동화 완벽 가이드
- [../docs/KAKAO-LOGIN-SETUP.md](../docs/KAKAO-LOGIN-SETUP.md) - 초기 설정 가이드
- [../docs/GET-KAKAO-TOKEN.md](../docs/GET-KAKAO-TOKEN.md) - 토큰 발급 방법
- [../docs/AUTO-START-README.md](../docs/AUTO-START-README.md) - 서버 자동화

---

## 🔐 보안 주의사항

1. **환경변수 파일 관리**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - 파일 권한: `chmod 600 .env`

2. **토큰 파일 보안**
   - `kakao-tokens.json`은 민감한 정보 포함
   - `.gitignore`에 포함되어 있는지 확인

3. **로그 파일**
   - `logs/kakao-login.log`에 민감한 정보가 남을 수 있음
   - 주기적으로 로그 정리 필요

---

**작성일**: 2025-12-04
**마지막 업데이트**: 2025-12-04
