import { z } from 'zod';

// 계산기 도구 스키마
export const CalculatorSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

export type CalculatorInput = z.infer<typeof CalculatorSchema>;

// 날씨 도구 스키마
export const WeatherSchema = z.object({
  city: z.string(),
  country: z.string().optional(),
});

export type WeatherInput = z.infer<typeof WeatherSchema>;

// 도구 결과 타입
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// 계산기 결과
export interface CalculatorResult extends ToolResult {
  data?: {
    result: number;
    operation: string;
    a: number;
    b: number;
  };
}

// 날씨 결과
export interface WeatherResult extends ToolResult {
  data?: {
    city: string;
    temperature: number;
    description: string;
    humidity: number;
  };
}

