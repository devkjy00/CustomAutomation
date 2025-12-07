import { WeatherInput, WeatherResult, WeatherSchema } from '../types/index.js';

export class WeatherTool {
  static async execute(input: WeatherInput): Promise<WeatherResult> {
    try {
      const { city, country } = input;
      
      // 실제 구현에서는 OpenWeatherMap API 등을 사용할 수 있습니다
      // 여기서는 시뮬레이션된 데이터를 반환합니다
      const mockWeatherData = {
        city,
        temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
        description: this.getRandomDescription(),
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      };

      // 실제 API 호출을 시뮬레이션하기 위한 지연
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        data: mockWeatherData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data',
      };
    }
  }

  private static getRandomDescription(): string {
    const descriptions = [
      '맑음',
      '흐림',
      '비',
      '눈',
      '안개',
      '구름 많음',
      '소나기',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  static getDescription() {
    return {
      name: 'weather',
      description: 'Get current weather information for a city',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name to get weather for',
          },
          country: {
            type: 'string',
            description: 'Country code (optional)',
          },
        },
        required: ['city'],
      },
    };
  }
}
