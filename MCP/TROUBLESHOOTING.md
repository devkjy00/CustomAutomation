# MCP 프로젝트 트러블슈팅 가이드

이 문서는 MCP 프로젝트 생성 과정에서 발생했던 오류들과 해결 방법을 정리한 것입니다.

## 1. TypeScript 빌드 오류

### 오류: Server 생성자 인수 오류
```
src/server.ts:20:7 - error TS2554: Expected 1 arguments, but got 2.
```

**원인**: MCP SDK의 Server 생성자가 최신 버전에서 변경됨

**해결 방법**:
```typescript
// 이전 코드 (오류)
this.server = new Server(
  {
    name: 'mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 수정된 코드
this.server = new Server({
  name: 'mcp-server',
  version: '1.0.0',
});
```

### 오류: 도구 클래스 import 오류
```
src/tools/index.ts:5:15 - error TS2304: Cannot find name 'CalculatorTool'.
src/tools/index.ts:6:12 - error TS2304: Cannot find name 'WeatherTool'.
```

**원인**: 도구 클래스들을 import하지 않고 export만 했음

**해결 방법**:
```typescript
// 수정된 src/tools/index.ts
import { CalculatorTool } from './calculator.js';
import { WeatherTool } from './weather.js';

export { CalculatorTool } from './calculator.js';
export { WeatherTool } from './weather.js';

export const tools = {
  calculator: CalculatorTool,
  weather: WeatherTool,
};
```

## 2. MCP SDK 스키마 타입 오류

### 오류: inputSchema 타입 불일치
```
Type 'ZodObject<...>' is not assignable to type '{ type: "object"; properties?: ... }'
```

**원인**: MCP SDK가 특정한 형태의 JSON 스키마를 요구함

**해결 방법**: Zod 스키마 대신 JSON 스키마 객체 사용
```typescript
// 이전 코드 (오류)
static getDescription() {
  return {
    name: 'calculator',
    description: '...',
    inputSchema: CalculatorSchema, // Zod 스키마
  };
}

// 수정된 코드
static getDescription() {
  return {
    name: 'calculator',
    description: '...',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'The mathematical operation to perform',
        },
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['operation', 'a', 'b'],
    },
  };
}
```

## 3. Jest 테스트 설정 오류

### 오류: moduleNameMapping 옵션 오류
```
Unknown option "moduleNameMapping" with value {...} was found.
```

**원인**: Jest 설정에서 옵션명이 잘못됨

**해결 방법**:
```javascript
// 이전 코드 (오류)
moduleNameMapping: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},

// 수정된 코드
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
```

### 오류: TypeScript 타입 변환 오류
```
Conversion of type '{ operation: "power"; ... }' to type 'CalculatorInput' may be a mistake
```

**원인**: 테스트에서 타입 안전성을 무시하고 잘못된 값을 전달

**해결 방법**:
```typescript
// 이전 코드 (오류)
const input = {
  operation: 'power',
  a: 2,
  b: 3,
} as CalculatorInput;

// 수정된 코드
const input = {
  operation: 'power' as any,
  a: 2,
  b: 3,
};
```

## 4. 의존성 관련 오류

### 해결된 의존성 추가
```json
{
  "devDependencies": {
    "ts-jest": "^29.1.0"  // Jest에서 TypeScript ESM 지원을 위해 추가
  }
}
```

## 5. 일반적인 해결 방법

### 빌드 오류 해결 순서
1. TypeScript 컴파일 오류 확인
2. import/export 문법 검증
3. 타입 정의 확인
4. MCP SDK 버전 호환성 확인

### 테스트 오류 해결 순서
1. Jest 설정 파일 검증
2. TypeScript 타입 오류 수정
3. 테스트 케이스 로직 검증

### 런타임 오류 해결 순서
1. 의존성 설치 확인 (`npm install`)
2. 빌드 확인 (`npm run build`)
3. 환경 변수 설정 확인
4. 로그 메시지 분석

## 6. 유용한 명령어

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 타입 체크
npx tsc --noEmit

# 테스트 실행
npm test

# 빌드 및 실행
npm run build && npm start
```

## 7. 참고 자료

- [MCP SDK 문서](https://modelcontextprotocol.io/)
- [TypeScript ESM 설정](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Jest TypeScript 설정](https://jestjs.io/docs/getting-started#using-typescript)
