import { CalculatorInput, CalculatorResult, CalculatorSchema } from '../types/index.js';

export class CalculatorTool {
  static async execute(input: CalculatorInput): Promise<CalculatorResult> {
    try {
      const { operation, a, b } = input;
      let result: number;

      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            return {
              success: false,
              error: 'Division by zero is not allowed',
            };
          }
          result = a / b;
          break;
        default:
          return {
            success: false,
            error: `Unknown operation: ${operation}`,
          };
      }

      return {
        success: true,
        data: {
          result,
          operation,
          a,
          b,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static getDescription() {
    return {
      name: 'calculator',
      description: 'Perform basic mathematical operations (add, subtract, multiply, divide)',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide'],
            description: 'The mathematical operation to perform',
          },
          a: {
            type: 'number',
            description: 'First number',
          },
          b: {
            type: 'number',
            description: 'Second number',
          },
        },
        required: ['operation', 'a', 'b'],
      },
    };
  }
}
