# 카카오 로그인 자동화 설정 가이드

## 빠른 시작

### 1단계: .env 파일 생성
```bash
cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation

# .env.example을 복사
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 파일에 입력할 내용:**
```
KAKAO_EMAIL=your-actual-email@example.com
KAKAO_PASSWORD=your-actual-password
```

### 2단계: CustomAutomation 서버 시작 (필수)
```bash
./start-server.sh start
```

서버가 실행되어야 카카오 콜백 엔드포인트(`/kakao/callback`)가 동작합니다.

### 3단계: 자동화 스크립트 실행
```bash
# 방법 1: 간편 실행 스크립트 사용
./run-kakao-login.sh

# 방법 2: 직접 Node.js 실행
node kakao-auth-automation.js
```

## 작동 과정

1. ✅ .env 파일에서 카카오 계정 정보 로드
2. 🌐 Playwright가 Chrome 브라우저 자동 실행
3. 📝 카카오 로그인 페이지에서 자동 로그인
4. ✅ 권한 동의 자동 클릭
5. 🔑 Authorization Code 추출
6. 🎫 Access Token 및 Refresh Token 발급
7. 💾 `kakao-tokens.json` 파일에 토큰 저장
8. 📤 CustomAutomation 서버에 토큰 전달

## 실행 결과

성공 시 다음과 같은 출력이 나타납니다:

```
🚀 카카오 로그인 자동화 시작...

1️⃣ 카카오 인증 페이지로 이동...
2️⃣ 로그인 정보 입력...
3️⃣ 로그인 버튼 클릭...
4️⃣ 권한 동의 버튼 클릭...
5️⃣ Authorization Code 추출 중...
✓ Authorization Code: abc123...

6️⃣ Access Token 발급 중...
✓ Access Token 발급 성공!
  - Access Token: xyz789...
  - Refresh Token: def456...
  - Expires In: 21599초

✓ 토큰이 ./kakao-tokens.json에 저장되었습니다.

7️⃣ 서버에 토큰 전달 중...
✓ 서버에 Authorization Code 전달 완료
```

## 생성된 파일

### kakao-tokens.json
```json
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "expires_in": 21599,
  "refresh_token_expires_in": 5183999
}
```

이 파일은 자동으로 생성되며 다음 용도로 사용됩니다:
- Access Token 갱신 시 참조
- 토큰 만료 시각 확인
- 수동으로 토큰 사용 시 참조

## 토큰 갱신

Access Token은 약 6시간 후 만료됩니다. 갱신 방법:

### 방법 1: 자동화 스크립트로 갱신
```bash
node kakao-auth-automation.js refresh
```

### 방법 2: Bash 스크립트로 갱신
```bash
./kakao-token-refresh.sh
```

### 방법 3: 재로그인
```bash
./run-kakao-login.sh
```

## 메시지 전송 테스트

토큰이 발급된 후 메시지를 전송할 수 있습니다:

```bash
curl -X POST http://localhost:8081/message/send \
  -H "Content-Type: application/json" \
  -d '{"text": "안녕하세요! 테스트 메시지입니다."}'
```

**예상 응답:**
```
메시지 전송에 성공했습니다.
```

## 문제 해결

### 1. "KAKAO_EMAIL 또는 KAKAO_PASSWORD 환경변수가 설정되지 않았습니다"

**원인:** .env 파일이 없거나 내용이 비어있음

**해결:**
```bash
# .env 파일 생성
cp .env.example .env

# 내용 편집
nano .env
```

### 2. "서버 연결 실패"

**원인:** CustomAutomation 서버가 실행되지 않음

**해결:**
```bash
./start-server.sh start

# 서버 상태 확인
./start-server.sh status
```

### 3. 브라우저가 자동으로 닫힘 또는 오류 발생

**원인:** Playwright 브라우저 미설치

**해결:**
```bash
# Playwright 브라우저 설치
npx playwright install chromium

# 또는 모든 브라우저 설치
npx playwright install
```

### 4. "redirect_uri 불일치" 에러

**원인:** 카카오 개발자 콘솔에 Redirect URI 미등록

**해결:**
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 선택
3. 앱 설정 > 플랫폼 > Web 플랫폼 등록
4. Redirect URI 추가: `http://southoftheriver.synology.me:8081/kakao/callback`
5. 저장

### 5. 로그인 실패 또는 비밀번호 오류

**원인:** .env 파일의 계정 정보 오류

**해결:**
- .env 파일에서 이메일/비밀번호 확인
- 카카오 계정 로그인 페이지에서 수동으로 로그인 테스트
- 2단계 인증이 설정된 경우 해제 필요

### 6. "액세스 토큰이 없습니다" 메시지 전송 시 에러

**원인:** 서버에 토큰이 전달되지 않았거나 서버 재시작으로 토큰 손실

**해결:**
```bash
# 재로그인
./run-kakao-login.sh

# 또는 브라우저로 직접 인증
open "https://kauth.kakao.com/oauth/authorize?client_id=620c9095c04cad076902cde3e1237d7a&redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback&response_type=code&scope=profile,talk_message"
```

## Cron으로 자동 갱신 설정

토큰이 자동으로 만료되지 않도록 주기적으로 갱신:

```bash
# crontab 편집
crontab -e

# 매 5시간마다 토큰 갱신 (자동화 스크립트)
0 */5 * * * cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && node kakao-auth-automation.js refresh >> logs/kakao-refresh.log 2>&1

# 또는 Bash 스크립트 사용
0 */5 * * * cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./kakao-token-refresh.sh >> logs/kakao-refresh.log 2>&1
```

## 보안 권장사항

### 1. .env 파일 보호
```bash
# 파일 권한 설정 (소유자만 읽기/쓰기)
chmod 600 .env

# .gitignore에 추가 (이미 설정됨)
# .env
# kakao-tokens.json
```

### 2. 토큰 파일 백업
```bash
# 정기적으로 백업
cp kakao-tokens.json kakao-tokens.backup.json

# 또는 암호화하여 저장
openssl enc -aes-256-cbc -salt -in kakao-tokens.json -out kakao-tokens.json.enc
```

### 3. 서버 환경변수로 관리 (프로덕션)
```bash
# 시스템 환경변수로 설정
export KAKAO_EMAIL="email@example.com"
export KAKAO_PASSWORD="password"

# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'export KAKAO_EMAIL="email@example.com"' >> ~/.bashrc
echo 'export KAKAO_PASSWORD="password"' >> ~/.bashrc
```

## 디버깅 모드

브라우저를 보면서 실행하려면 스크립트에서 `headless: false` 설정이 이미 되어 있습니다.

**브라우저를 보지 않고 실행 (headless mode):**
```javascript
// kakao-auth-automation.js 파일에서 수정
const browser = await chromium.launch({
    headless: true  // false → true로 변경
});
```

## 추가 명령어

### 전체 설정 확인
```bash
# 환경 확인
cat .env

# 토큰 확인
cat kakao-tokens.json

# 서버 상태 확인
./start-server.sh status

# 로그 확인
tail -f logs/application.log
```

### 클린업
```bash
# 토큰 삭제 (재로그인 필요)
rm kakao-tokens.json

# 로그 삭제
rm -rf logs/

# Node 모듈 재설치
rm -rf node_modules
npm install
```

## 참고 자료

- [카카오 로그인 API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오톡 메시지 API 문서](https://developers.kakao.com/docs/latest/ko/message/rest-api)
- [Playwright 문서](https://playwright.dev/)
