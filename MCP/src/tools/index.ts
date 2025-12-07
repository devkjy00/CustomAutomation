import { CalculatorTool } from './calculator.js';
import { WeatherTool } from './weather.js';

export { CalculatorTool } from './calculator.js';
export { WeatherTool } from './weather.js';

export const tools = {
  calculator: CalculatorTool,
  weather: WeatherTool,
};

export type ToolName = keyof typeof tools;
