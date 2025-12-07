import { CalculatorTool } from './calculator.js';
import { CalculatorInput } from '../types/index.js';

describe('CalculatorTool', () => {
  describe('execute', () => {
    it('should add two numbers correctly', async () => {
      const input: CalculatorInput = {
        operation: 'add',
        a: 5,
        b: 3,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(8);
      expect(result.data?.operation).toBe('add');
    });

    it('should subtract two numbers correctly', async () => {
      const input: CalculatorInput = {
        operation: 'subtract',
        a: 10,
        b: 4,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(6);
      expect(result.data?.operation).toBe('subtract');
    });

    it('should multiply two numbers correctly', async () => {
      const input: CalculatorInput = {
        operation: 'multiply',
        a: 6,
        b: 7,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(42);
      expect(result.data?.operation).toBe('multiply');
    });

    it('should divide two numbers correctly', async () => {
      const input: CalculatorInput = {
        operation: 'divide',
        a: 20,
        b: 4,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(5);
      expect(result.data?.operation).toBe('divide');
    });

    it('should handle division by zero', async () => {
      const input: CalculatorInput = {
        operation: 'divide',
        a: 10,
        b: 0,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Division by zero is not allowed');
    });

    it('should handle unknown operation', async () => {
      const input = {
        operation: 'power' as any,
        a: 2,
        b: 3,
      };

      const result = await CalculatorTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown operation: power');
    });
  });

  describe('getDescription', () => {
    it('should return correct tool description', () => {
      const description = CalculatorTool.getDescription();

      expect(description.name).toBe('calculator');
      expect(description.description).toContain('mathematical operations');
      expect(description.inputSchema).toBeDefined();
      expect(description.inputSchema.properties).toBeDefined();
      expect(description.inputSchema.required).toContain('operation');
      expect(description.inputSchema.required).toContain('a');
      expect(description.inputSchema.required).toContain('b');
    });
  });
});
