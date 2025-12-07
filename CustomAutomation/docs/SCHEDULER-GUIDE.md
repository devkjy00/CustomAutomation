# 정기 메시지 스케줄러 가이드

## 개요

1시간마다 AI(Dalai)에게 특정 테마에 대한 응답을 받아 카카오톡으로 자동 전송하는 스케줄러 시스템입니다.

## 아키텍처

```
┌─────────────────────────────────────────────┐
│         ScheduledMessageService             │
│  (Spring @Scheduled - 매시 정각 실행)        │
└──────────────┬──────────────────────────────┘
               │
               ├──> 1. ThemePromptService
               │      시간대별 테마 선택
               │
               ├──> 2. DalaiClient (Feign)
               │      AI 응답 요청
               │
               └──> 3. KakaoMsgServiceImpl
                      카카오톡 메시지 전송
```

## 주요 컴포넌트

### 1. SchedulerConfig.java
```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
}
```
- Spring Scheduling 활성화

### 2. ThemePromptService.java
**8가지 테마 제공**

| 테마 | 설명 | 시간대 |
|------|------|--------|
| 명언 | 동기부여 명언 | 아침 (6-11시) |
| 건강 팁 | 건강 관리 조언 | 아침 (6-11시) |
| 생산성 | 업무 효율성 팁 | 낮 (12-17시) |
| 시간 관리 | 시간 관리 방법 | 낮 (12-17시) |
| 기술 트렌드 | IT/개발 트렌드 | 전체 |
| 학습 조언 | 학습 방법론 | 저녁 (18-23시) |
| 마인드셋 | 긍정적 사고 | 저녁/새벽 (18-5시) |
| 창의성 | 창의적 사고법 | 새벽 (0-5시) |

**주요 메서드**
- `getRandomTheme()` - 랜덤 테마 선택
- `getThemeByTime()` - 시간대별 테마 선택
- `addTheme(theme, prompt)` - 커스텀 테마 추가

### 3. ScheduledMessageService.java
**스케줄 설정**

```java
@Scheduled(cron = "0 0 * * * *")  // 매시 정각
public void sendHourlyAIMessage() {
    // 1. 시간대 기반 테마 선택
    ThemePrompt theme = themePromptService.getThemeByTime();

    // 2. AI 응답 요청
    String aiResponse = dalaiClient.sendPrompt(theme.getPrompt());

    // 3. 메시지 포맷팅
    String message = String.format("[%s]\n%s", theme.getTheme(), aiResponse);

    // 4. 카카오톡 전송
    kakaoMsgService.sendMessage(message);
}
```

**Cron 표현식**
- `0 0 * * * *` = 매시 정각 (00분 00초)
- 초 분 시 일 월 요일

**테스트용 메서드**
```java
// 1분마다 실행 (주석 해제 시)
// @Scheduled(cron = "0 * * * * *")
public void sendTestMessage() { ... }
```

### 4. ScheduledMessageController.java
**API 엔드포인트**

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/scheduled/test` | GET | 테스트 메시지 즉시 전송 |
| `/scheduled/manual?prompt={text}` | GET | 커스텀 프롬프트 전송 |
| `/scheduled/themes` | GET | 등록된 모든 테마 조회 |
| `/scheduled/theme/random` | GET | 랜덤 테마 조회 |
| `/scheduled/theme/current` | GET | 현재 시간대 테마 조회 |
| `/scheduled/theme/add` | POST | 새 테마 추가 |

---

## 사용법

### 1. 기본 설정

스케줄러는 서버 시작 시 자동으로 활성화됩니다.

```bash
./start-server.sh start
```

### 2. 테스트

#### 등록된 테마 확인
```bash
curl "http://localhost:8081/scheduled/themes"
```

#### 현재 시간대 테마 확인
```bash
curl "http://localhost:8081/scheduled/theme/current"
```

#### 수동으로 테스트 메시지 전송
```bash
curl "http://localhost:8081/scheduled/test"
```

#### 커스텀 프롬프트로 전송
```bash
curl -G "http://localhost:8081/scheduled/manual" \
  --data-urlencode "prompt=오늘의 날씨와 기분 좋은 인사말을 알려줘"
```

### 3. 새 테마 추가

```bash
curl -X POST "http://localhost:8081/scheduled/theme/add" \
  -d "theme=날씨" \
  -d "prompt=오늘의 날씨를 간단히 알려줘"
```

---

## 스케줄 변경

### 실행 주기 변경

`ScheduledMessageService.java` 파일에서 `@Scheduled` 어노테이션 수정:

```java
// 1시간마다 (기본값)
@Scheduled(cron = "0 0 * * * *")

// 30분마다
@Scheduled(cron = "0 0,30 * * * *")

// 2시간마다
@Scheduled(cron = "0 0 */2 * * *")

// 매일 오전 9시
@Scheduled(cron = "0 0 9 * * *")

// 평일 오전 9시
@Scheduled(cron = "0 0 9 * * MON-FRI")
```

### 테스트 모드 활성화

`sendTestMessage()` 메서드의 주석 해제:

```java
@Scheduled(cron = "0 * * * * *")  // 1분마다 실행
public void sendTestMessage() {
    // ...
}
```

**주의**: 테스트 후 다시 주석 처리하세요!

---

## 메시지 포맷

### 기본 포맷
```
[테마명]
AI 응답 내용
```

### 예시
```
[명언]
"성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 계속할 용기다." - 윈스턴 처칠
꾸준함이 성공의 핵심이라는 의미입니다.
```

---

## 로그 확인

### 스케줄 실행 로그
```bash
tail -f logs/application.log | grep "정기 메시지"
```

**로그 예시**
```
2025-12-04T14:00:00 INFO  ScheduledMessageService - === 정기 메시지 전송 시작 ===
2025-12-04T14:00:00 INFO  ScheduledMessageService - 선택된 테마: 생산성
2025-12-04T14:00:00 INFO  ScheduledMessageService - AI 응답 요청 중...
2025-12-04T14:00:02 INFO  ScheduledMessageService - AI 응답 수신 완료
2025-12-04T14:00:02 INFO  ScheduledMessageService - 카카오톡 메시지 전송 중...
2025-12-04T14:00:03 INFO  ScheduledMessageService - 전송 결과: 메시지 전송에 성공했습니다.
2025-12-04T14:00:03 INFO  ScheduledMessageService - === 정기 메시지 전송 완료 ===
```

### 에러 로그
```bash
tail -f logs/application.log | grep "ERROR"
```

---

## 트러블슈팅

### 문제 1: AI 서버 연결 실패
**에러**: `Connection refused` 또는 `java.net.ConnectException`

**원인**: Dalai AI 서버가 실행되지 않음

**해결**:
```bash
# AI 서버 실행 상태 확인
curl "http://southoftheriver.synology.me:3000/"

# AI 서버 시작 (AI/my-project 디렉토리에서)
cd ../AI/my-project
npm start
```

### 문제 2: 카카오톡 전송 실패
**에러**: `액세스 토큰이 없습니다`

**원인**: 카카오 로그인이 되지 않았거나 토큰 만료

**해결**:
```bash
# 서버 재시작 (자동 로그인 포함)
./start-server.sh restart

# 또는 수동 로그인
./scripts/run-kakao-login.sh
```

### 문제 3: 스케줄러가 실행되지 않음
**원인**: `@EnableScheduling` 누락 또는 스케줄러 비활성화

**확인**:
1. `SchedulerConfig.java`에 `@EnableScheduling` 있는지 확인
2. 서버 로그에서 스케줄러 초기화 메시지 확인
3. `application.yml`에서 스케줄러 설정 확인

### 문제 4: 메시지가 너무 자주/적게 전송됨
**원인**: Cron 표현식 잘못 설정

**확인**:
```java
@Scheduled(cron = "0 0 * * * *")  // 초 분 시 일 월 요일
                   ^
                   이 부분이 0이면 매시 정각
```

---

## 시스템 요구사항

### 필수 서비스
1. **CustomAutomation 서버** (port 8081)
   - Spring Boot 애플리케이션
   - 카카오 로그인 완료 상태

2. **Dalai AI 서버** (port 3000)
   - `http://southoftheriver.synology.me:3000`
   - Dalai 모델 로드 완료

3. **카카오 OAuth 토큰**
   - Access Token이 메모리에 로드되어 있어야 함
   - 자동 로그인으로 자동 발급

### 권장 설정
- 서버 메모리: 최소 512MB
- AI 응답 타임아웃: 30초
- 네트워크: 안정적인 외부 연결

---

## 확장 아이디어

### 1. 사용자별 커스텀 테마
```java
public class UserThemeService {
    private Map<String, List<ThemePrompt>> userThemes;

    public ThemePrompt getThemeForUser(String userId) {
        // 사용자별 선호 테마 반환
    }
}
```

### 2. 다국어 지원
```java
themes.add(new ThemePrompt(
    "명언",
    "Give me a motivational quote in Korean with brief explanation in 50 characters."
));
```

### 3. 통계 및 분석
```java
@Service
public class MessageStatisticsService {
    private Map<String, Integer> themeCounts;

    public void recordMessage(String theme) {
        themeCounts.merge(theme, 1, Integer::sum);
    }

    public Map<String, Integer> getStatistics() {
        return themeCounts;
    }
}
```

### 4. 조건부 전송
```java
@Scheduled(cron = "0 0 * * * *")
public void sendConditionalMessage() {
    LocalTime now = LocalTime.now();

    // 근무 시간에만 전송
    if (now.getHour() >= 9 && now.getHour() < 18) {
        sendHourlyAIMessage();
    }
}
```

---

## 관련 파일

### Java 클래스
- `src/main/java/jy/demo/config/SchedulerConfig.java`
- `src/main/java/jy/demo/service/ScheduledMessageService.java`
- `src/main/java/jy/demo/service/ThemePromptService.java`
- `src/main/java/jy/demo/controller/ScheduledMessageController.java`
- `src/main/java/jy/demo/dto/ThemePrompt.java`

### 관련 문서
- [KAKAO-AUTO-LOGIN-GUIDE.md](./KAKAO-AUTO-LOGIN-GUIDE.md) - 카카오 자동 로그인
- [AUTO-START-README.md](./AUTO-START-README.md) - 서버 자동 시작

---

**작성일**: 2025-12-04
**마지막 업데이트**: 2025-12-04
**작성자**: Claude Code with CustomAutomation Team
