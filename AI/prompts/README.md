# AI Prompts Documentation

이 폴더에는 AI 웹 검색 시스템에서 사용되는 모든 프롬프트가 마크다운 파일로 정리되어 있습니다.

## 프롬프트 목록

### 1. Search Keywords Generation (`search-keywords-generation.md`)
- **목적**: 사용자 질문을 분석하여 웹 검색 최적화 검색어 생성
- **입력**: 사용자의 원본 질문
- **출력**: 최적화된 검색어

### 2. Best Websites Analysis (`best-websites-analysis.md`)
- **목적**: 질문 유형에 가장 적합한 웹사이트 추천
- **입력**: 원본 질문, 검색어
- **출력**: 추천 웹사이트 목록 (최대 3개)

### 3. Search Quality Verification (`search-quality-verification.md`)
- **목적**: 검색 결과에 실제 답변이 포함되어 있는지 엄격하게 검증
- **입력**: 질문, 검색 결과
- **출력**: hasAnswer (yes/no), missingInfo (부족한 정보)

### 4. Alternative Search Strategy (`alternative-search-strategy.md`)
- **목적**: 검색 실패 시 대안 검색 전략 생성
- **입력**: 원본 질문, 부족한 정보, 시도 횟수
- **출력**: 새로운 검색어, 타겟 웹사이트

### 5. Search Results Filtering (`search-results-filtering.md`)
- **목적**: 검색 결과에서 핵심 정보만 추출
- **입력**: 질문, 타겟 웹사이트, 원본 검색 결과
- **출력**: 필터링된 검색 결과 요약

### 6. Final Answer Generation (`final-answer-generation.md`)
- **목적**: 검색 결과 기반 최종 답변 생성
- **입력**: RAG 컨텍스트, 사용자 질문
- **출력**: 통합된 최종 답변

## 워크플로우

```
사용자 질문
    ↓
1. Search Keywords Generation
    ↓
2. Best Websites Analysis
    ↓
3. 웹 검색 수행
    ↓
4. Search Results Filtering
    ↓
5. Search Quality Verification
    ↓
   실패? → Alternative Search Strategy → 3번으로 (최대 3회)
    ↓
   성공
    ↓
6. RAG에 저장
    ↓
7. Final Answer Generation
    ↓
최종 답변
```

## 프롬프트 수정 가이드

각 마크다운 파일은 다음 구조를 따릅니다:

- **Purpose**: 프롬프트의 목적
- **Template**: 실제 프롬프트 템플릿 (변수 포함)
- **Variables**: 템플릿에서 사용되는 변수 설명
- **Expected Output**: 예상 출력 형식

프롬프트를 수정할 때는:
1. 해당 마크다운 파일을 수정
2. `routes/users.js`에서 프롬프트를 불러오도록 수정 (향후 개선 예정)

## 로깅

모든 AI 요청과 응답은 `/tmp/ai-requests.log`에 기록됩니다.

로그 형식:
```
2025-12-06T14:14:45.900Z
================================================================================
[AI REQUEST] Context Name
================================================================================
PROMPT:
...
================================================================================

2025-12-06T14:14:53.006Z
================================================================================
[AI RESPONSE] Context Name
Duration: 7105ms
================================================================================
RESPONSE:
...
================================================================================
```
