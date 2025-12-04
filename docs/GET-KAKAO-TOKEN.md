# 카카오 로그인 자동화 가이드

## 개요
CustomAutomation 서버는 카카오 OAuth 2.0을 사용해 카카오톡 메시지를 보낼 수 있습니다.
이 문서는 카카오 로그인을 자동화하는 3가지 방법을 설명합니다.

---

## 방법 1: 브라우저에서 직접 인증 (가장 간단)

### 1단계: 인증 URL 생성
```
https://kauth.kakao.com/oauth/authorize?client_id=620c9095c04cad076902cde3e1237d7a&redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback&response_type=code&scope=profile,talk_message
```

### 2단계: 브라우저에서 위 URL 접속
1. 카카오 로그인 페이지에서 로그인
2. 권한 동의
3. 자동으로 서버의 `/kakao/callback` 엔드포인트로 리다이렉트됨
4. 서버가 자동으로 Access Token 발급 및 저장

### 3단계: 메시지 전송 테스트
```bash
curl -X POST http://localhost:8081/message/send \
  -H "Content-Type: application/json" \
  -d '{"text": "테스트 메시지"}'
```

---

## 방법 2: Playwright로 완전 자동화

### 사전 준비
```bash
cd CustomAutomation
npm init -y  # package.json이 없는 경우
npm install playwright
```

### 환경변수 설정
```bash
export KAKAO_EMAIL="your-email@example.com"
export KAKAO_PASSWORD="your-password"
```

### 실행
```bash
# 최초 로그인 및 토큰 발급
node kakao-auth-automation.js

# Refresh Token으로 갱신 (이후 사용)
node kakao-auth-automation.js refresh
```

### 결과
- `kakao-tokens.json` 파일에 토큰이 저장됨
- 서버에도 자동으로 토큰이 전달됨

---

## 방법 3: Refresh Token으로 자동 갱신

Access Token은 약 6시간마다 만료되므로, Refresh Token으로 주기적으로 갱신해야 합니다.

### Bash 스크립트 사용
```bash
cd CustomAutomation
./kakao-token-refresh.sh
```

### Cron으로 자동 갱신 설정
```bash
# crontab 편집
crontab -e

# 매 5시간마다 토큰 갱신
0 */5 * * * cd /Users/jy_mac/MyDir/project/customAuto/CustomAutomation && ./kakao-token-refresh.sh
```

### 수동으로 cURL 사용
```bash
# Refresh Token으로 새 Access Token 발급
curl -X POST "https://kauth.kakao.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=620c9095c04cad076902cde3e1237d7a" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

---

## 서버 API 사용법

### Authorization Code로 토큰 발급
```bash
curl "http://localhost:8081/kakao/callback?code=YOUR_AUTH_CODE"
```

### 메시지 전송
```bash
curl -X POST http://localhost:8081/message/send \
  -H "Content-Type: application/json" \
  -d '{"text": "안녕하세요! 카카오톡 메시지입니다."}'
```

---

## 토큰 파일 형식 (kakao-tokens.json)

```json
{
  "access_token": "your_access_token_here",
  "refresh_token": "your_refresh_token_here",
  "expires_in": 21599,
  "updated_at": "2025-12-04T06:30:00Z"
}
```

---

## 트러블슈팅

### 1. "액세스 토큰이 없습니다" 에러
**원인**: 서버의 `KakaoMsgServiceImpl.accessToken`이 비어있음

**해결**:
```bash
# 방법 1: 브라우저로 재인증
open "https://kauth.kakao.com/oauth/authorize?client_id=620c9095c04cad076902cde3e1237d7a&redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback&response_type=code&scope=profile,talk_message"

# 방법 2: 스크립트로 자동 로그인
node kakao-auth-automation.js
```

### 2. "redirect_uri 불일치" 에러
**원인**: 카카오 개발자 콘솔에 Redirect URI가 등록되지 않음

**해결**:
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 > 앱 설정 > 플랫폼
3. Redirect URI 추가: `http://southoftheriver.synology.me:8081/kakao/callback`

### 3. Token 만료
**원인**: Access Token은 6시간마다 만료됨

**해결**:
```bash
# Refresh Token으로 갱신
./kakao-token-refresh.sh

# 또는 재로그인
node kakao-auth-automation.js
```

### 4. 서버 재시작 시 토큰 손실
**원인**: `KakaoMsgServiceImpl`의 `accessToken`이 메모리에만 저장됨

**해결 방안**:
- 파일에 토큰 저장하고 서버 시작 시 로드
- 데이터베이스에 저장
- Redis 같은 캐시 사용

---

## 보안 권장사항

⚠️ **주의**: 현재 `application.yml`에 API 키가 하드코딩되어 있습니다.

### 개선 방법
```bash
# 환경변수로 관리
export KAKAO_API_KEY="your_api_key"
export KAKAO_OAUTH_SECRET="your_secret"

# application.yml에서 참조
# kakao:
#   api:
#     key: ${KAKAO_API_KEY}
```

### Git에서 제외
```bash
# .gitignore에 추가
kakao-tokens.json
application-local.yml
```

---

## 추가 개선 사항

### 서버에 토큰 자동 갱신 기능 추가

**Java 코드 예시**:
```java
@Scheduled(fixedRate = 18000000) // 5시간마다
public void refreshAccessToken() {
    if (!refrashToken.isEmpty()) {
        // Refresh Token으로 새 Access Token 발급
        // ...
    }
}
```

### 토큰 영속화
```java
@Service
public class KakaoTokenRepository {
    private final String TOKEN_FILE = "kakao-tokens.json";

    public void saveToken(String accessToken, String refreshToken) {
        // 파일에 저장
    }

    public KakaoToken loadToken() {
        // 파일에서 로드
    }
}
```
