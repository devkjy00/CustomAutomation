# Alternative Search Strategy Prompt

## Purpose
검색 실패 시 대안적인 검색 전략을 생성합니다.

## Template

```
원래 질문: "{{originalQuery}}"
부족한 정보: {{missingInfo}}
시도 횟수: {{attemptNumber}}

이전 검색에서 필요한 정보를 찾지 못했습니다. 대안적인 검색 전략을 제안하세요.

지침:
1. 부족한 정보를 얻을 수 있는 더 구체적인 검색어 생성
2. 시도 횟수에 따라 다른 접근 방식 사용
   - 1차 실패: 검색어를 더 구체적으로 (예: "서울 날씨" → "서울 실시간 기온")
   - 2차 실패: 다른 각도로 검색 (예: "서울 기상 현황", "서울 날씨 현재")
3. 새로운 타겟 웹사이트 제안 (더 구체적인 사이트)

출력 형식:
keywords: [새로운 검색어]
sites: [사이트1, 사이트2, 사이트3]

예시:
keywords: 서울 실시간 기온 온도
sites: 기상청, 케이웨더, 웨더아이

간결하게 출력하세요:
```

## Variables
- `{{originalQuery}}`: 원본 질문
- `{{missingInfo}}`: 부족한 정보 설명
- `{{attemptNumber}}`: 현재 시도 횟수 (1, 2, 3)

## Expected Output
```
keywords: 새로운 검색어
sites: [사이트1, 사이트2, 사이트3]
```
