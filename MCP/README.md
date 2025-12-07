# MCP Server

Model Context Protocol (MCP) 서버 구현체입니다.

## 설치

```bash
npm install
```

## 개발

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 실행

```bash
npm start
```

## 프로젝트 구조

```
src/
├── index.ts          # 메인 진입점
├── server.ts         # MCP 서버 구현
├── tools/            # 도구들
│   ├── calculator.ts
│   └── weather.ts
└── types/            # 타입 정의
    └── index.ts
```

## 기능

- 기본 MCP 서버 구현
- 계산기 도구
- 날씨 정보 도구
- 확장 가능한 도구 시스템

## 라이선스

MIT

