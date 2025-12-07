# 웹 검색 + RAG 기반 AI 자동화 시스템

## 개요

ChatGPT처럼 웹을 검색하고 최신 정보를 기반으로 답변을 생성하는 완전 자동화된 AI 메시징 시스템입니다.

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot Scheduler                     │
│                    (매시간 자동 실행)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    [테마 선택]
                 (Tech Insight 등)
                         │
                         ▼
                 [웹 검색 필요?]
                    /        \
                Yes /          \ No
                   /            \
                  ▼              ▼
         ┌──────────────┐   [일반 AI 호출]
         │ Web Search   │        │
         │ (DuckDuckGo) │        │
         └──────┬───────┘        │
                │                │
                ▼                │
         ┌──────────────┐        │
         │ RAG Storage  │        │
         │ (Vector DB)  │        │
         └──────┬───────┘        │
                │                │
                ▼                ▼
         ┌─────────────────────────┐
         │   Ollama AI (gemma3)     │
         │   + Web Context          │
         └───────────┬──────────────┘
                     │
                     ▼
              [AI 응답 생성]
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    [Slack 전송]          [카카오톡 전송]
```

## 주요 기능

### 1. 웹 검색 서비스 (WebSearchService)
- **위치**: `AI/my-project/services/webSearchService.js`
- **기능**:
  - DuckDuckGo HTML 검색 (봇 친화적)
  - Naver 검색 (한국어 콘텐츠)
  - 멀티소스 검색 (구글+네이버 통합)
  - 검색 결과 캐싱 (1시간)

**API 엔드포인트**:
```bash
# 웹 검색 수행
GET /users/search?q=검색어&source=multi

# 결과 예시
{
  "query": "AI trends 2024",
  "count": 3,
  "results": [
    {
      "title": "The Top AI Trends",
      "snippet": "Adapting to emerging trends...",
      "link": "https://...",
      "source": "duckduckgo"
    }
  ],
  "ragStats": {...}
}
```

### 2. RAG (Retrieval-Augmented Generation) 시스템
- **위치**: `AI/my-project/services/ragService.js`
- **기능**:
  - TF-IDF 기반 텍스트 벡터화
  - 코사인 유사도 검색
  - 인메모리 벡터 저장소 (최대 100개 문서)
  - 자동 오래된 문서 정리 (24시간)

**동작 방식**:
1. 웹 검색 결과를 RAG에 저장
2. 사용자 질문과 유사한 문서 검색
3. 관련 정보를 AI 프롬프트에 추가
4. AI가 최신 정보 기반 답변 생성

### 3. AI 서비스 통합
- **위치**: `AI/my-project/routes/users.js`

**자동 웹 검색 트리거**:
다음 키워드가 포함된 질문은 자동으로 웹 검색 수행:
```javascript
['최신', '오늘', '현재', '지금', '요즘', '최근',
 '뉴스', '트렌드', '인기', '화제',
 '날씨', '주가', '환율', '시황']
```

**API 사용법**:
```bash
# 웹 검색 없이 AI 호출
GET /users?q=명언을 알려줘

# 웹 검색 포함 AI 호출 (자동)
GET /users?q=최신 AI 트렌드 알려줘

# 웹 검색 강제 활성화
GET /users?q=AI에 대해 알려줘&search=true
```

### 4. Spring Boot 통합
- **위치**: `CustomAutomation/src/main/java/jy/demo/`

**주요 컴포넌트**:

#### ThemePrompt.java (DTO)
```java
public class ThemePrompt {
    private String theme;
    private String prompt;
    private boolean requiresWebSearch;  // 웹 검색 필요 플래그
}
```

#### DalaiClient.java (Feign Client)
```java
// 일반 호출
String sendPrompt(@RequestParam("q") String q);

// 웹 검색 포함 호출
String sendPromptWithSearch(
    @RequestParam("q") String q,
    @RequestParam("search") boolean search
);

// 직접 웹 검색
String performWebSearch(@RequestParam("q") String query);
```

#### ScheduledMessageService.java
```java
@Scheduled(cron = "0 0 * * * *")  // 매시간 정각
public void sendHourlyAIMessage() {
    ThemePrompt theme = themePromptService.getThemeByTime();

    // 테마에 따라 자동으로 웹 검색 활성화
    String rawResponse;
    if (theme.isRequiresWebSearch()) {
        rawResponse = dalaiClient.sendPromptWithSearch(
            theme.getPrompt(), true
        );
    } else {
        rawResponse = dalaiClient.sendPrompt(theme.getPrompt());
    }

    // Slack + 카카오톡 전송
    slackMsgService.sendRichMessage(theme.getTheme(), aiResponse);
    kakaoMsgService.sendMessage(message);
}
```

### 5. 웹 검색이 활성화된 테마

현재 **Tech Insight** 테마만 웹 검색이 활성화되어 있습니다:

```java
themes.add(new ThemePrompt(
    "🚀 Tech Insight",
    "당신은 기술 트렌드 애널리스트입니다. 최근 IT/개발 분야의 혁신 기술이나 트렌드를 선정하여...",
    true  // 웹 검색 필요
));
```

## 환경 설정

### .env 파일
```bash
# /Users/jy_mac/MyDir/project/customAuto/.env

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 서버 관리 스크립트
스크립트가 자동으로 .env 파일을 로드합니다:

```bash
./manage-servers.sh start   # .env 자동 로드
```

## 사용 방법

### 1. 서버 시작
```bash
cd /Users/jy_mac/MyDir/project/customAuto
./manage-servers.sh start
```

### 2. 웹 검색 테스트
```bash
# 웹 검색만 수행
curl "http://localhost:3000/users/search?q=최신%20AI%20트렌드"

# 웹 검색 + AI 응답
curl "http://localhost:3000/users?q=최신%20AI%20트렌드%20알려줘&search=true"
```

### 3. RAG 상태 확인
```bash
# RAG 통계
curl http://localhost:3000/users/rag/stats

# 응답 예시
{
  "totalDocuments": 15,
  "uniqueQueries": 5,
  "oldestDocument": "2025-12-06T10:00:00.000Z",
  "newestDocument": "2025-12-06T13:09:18.100Z"
}
```

### 4. 수동 메시지 테스트
```bash
curl "http://localhost:8081/scheduled/test"
```

## 워크플로우 예시

### 시나리오: Tech Insight 테마 실행

1. **스케줄러 트리거** (매시간 정각)
   ```
   12:00 PM - Tech Insight 테마 선택
   ```

2. **웹 검색 자동 활성화**
   ```
   requiresWebSearch = true
   → DuckDuckGo + Naver 검색 수행
   → 검색어: "최신 IT 기술 트렌드"
   ```

3. **검색 결과 수집**
   ```
   - IBM: "Top AI Trends 2024"
   - Forbes: "AI's Biggest Moments"
   - AI Magazine: "Top 10 AI Trends"
   ```

4. **RAG 저장 및 검색**
   ```
   - 3개 문서 벡터화 후 저장
   - 프롬프트와 유사도 계산
   - 상위 3개 문서 선택
   ```

5. **AI 프롬프트 강화**
   ```
   === 관련 정보 ===

   [참고 1] Top AI Trends 2024
   Adapting to emerging trends is essential...
   관련도: 87.5%

   [참고 2] AI's Biggest Moments
   AI trends of 2024, from generative AI...
   관련도: 82.3%

   질문: [원래 프롬프트]

   위의 최신 정보를 참고하여 답변해주세요.
   ```

6. **AI 응답 생성**
   ```
   Ollama (gemma3:27b) 모델이 웹 검색 결과를 바탕으로
   최신 AI 트렌드에 대한 전문적인 답변 생성
   ```

7. **메시지 전송**
   ```
   - Slack: Rich 포맷 (헤더 + 내용 + @here)
   - 카카오톡: 텍스트 메시지
   ```

## 로그 모니터링

### AI 서버 로그
```bash
tail -f /tmp/ai-server.log

# 출력 예시
[WebSearch] Searching DuckDuckGo for: AI trends 2024
[WebSearch] Found 3 results
[RAG] Added 3 documents. Total: 15
[AI] Web search enabled for query: 최신 AI 트렌드 알려줘
[AI] Enhanced prompt with web context
```

### CustomAuto 서버 로그
```bash
tail -f CustomAutomation/logs/application.log

# 출력 예시
=== 정기 메시지 전송 시작 ===
선택된 테마: 🚀 Tech Insight
웹 검색 필요 여부: true
웹 검색 모드로 AI 호출
AI 응답 수신 완료 (소요시간: 35000ms)
Slack 전송 결과: Rich 메시지 전송에 성공했습니다.
카카오톡 전송 결과: 메시지 전송에 성공했습니다.
=== 정기 메시지 전송 완료 ===
```

## 추가 테마에 웹 검색 추가하기

다른 테마에도 웹 검색을 추가하려면:

```java
// ThemePromptService.java
themes.add(new ThemePrompt(
    "📰 뉴스 브리핑",
    "당신은 뉴스 애널리스트입니다. 오늘의 주요 뉴스를...",
    true  // 웹 검색 활성화
));
```

## 성능 최적화

### 캐싱 전략
- **웹 검색 캐시**: 1시간 (동일 쿼리 재사용)
- **RAG 문서**: 24시간 (자동 정리)
- **최대 문서 수**: 100개 (LRU 방식)

### 응답 시간
- **웹 검색 없음**: 15-30초
- **웹 검색 포함**: 30-60초
  - 검색: 3-5초
  - RAG 처리: 1-2초
  - AI 생성: 25-50초

## 보안 고려사항

### .env 파일 보호
```bash
# .gitignore에 추가됨
.env

# 절대 커밋하지 말 것:
- SLACK_WEBHOOK_URL
- API Keys
- Credentials
```

### 웹 검색 제한
- User-Agent 설정으로 봇 식별
- Rate limiting 필요 시 구현 가능
- DuckDuckGo는 봇 친화적

## 트러블슈팅

### 웹 검색이 작동하지 않음
```bash
# 검색 결과 확인
curl "http://localhost:3000/users/search?q=test"

# cheerio 버전 확인
cd AI/my-project && npm list cheerio
```

### RAG가 비어있음
```bash
# RAG 상태 확인
curl http://localhost:3000/users/rag/stats

# 수동으로 검색 추가
curl "http://localhost:3000/users/search?q=AI"
```

### AI 응답이 느림
```bash
# Ollama 모델 상태 확인
ollama list

# 모델 재로드
ollama run gemma3:27b
```

## 향후 개선 사항

1. **벡터 DB 업그레이드**
   - ChromaDB, Pinecone 등 전문 벡터 DB 사용
   - 영구 저장 및 더 정확한 검색

2. **검색 엔진 다양화**
   - Google Custom Search API
   - Bing Search API
   - 뉴스 전용 API (NewsAPI)

3. **AI 모델 개선**
   - 더 큰 모델 사용 (70b+)
   - 멀티모달 지원 (이미지, 비디오)

4. **스마트 스케줄링**
   - 시간대별 다른 주제 자동 선택
   - 사용자 피드백 기반 학습

## 참고 문서

- [Server Management Guide](SERVER-MANAGEMENT.md)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Ollama Documentation](https://ollama.ai/docs)
- [DuckDuckGo API](https://duckduckgo.com/api)
