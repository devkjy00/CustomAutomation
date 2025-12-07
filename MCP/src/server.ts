import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, ToolName } from './tools/index.js';
import { CalculatorSchema, WeatherSchema } from './types/index.js';

export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-server',
        version: '1.0.0',
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolList: any[] = [];

      for (const [name, toolClass] of Object.entries(tools)) {
        const description = toolClass.getDescription();
        toolList.push({
          name: description.name,
          description: description.description,
          inputSchema: description.inputSchema,
        });
      }

      return {
        tools: toolList,
      };
    });

    // 도구 실행
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const toolClass = tools[name as ToolName];
        if (!toolClass) {
          throw new Error(`Tool '${name}' not found`);
        }

        let validatedArgs: any;

        // 도구별 스키마 검증
        switch (name) {
          case 'calculator':
            validatedArgs = CalculatorSchema.parse(args);
            break;
          case 'weather':
            validatedArgs = WeatherSchema.parse(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // 도구 실행
        const result = await toolClass.execute(validatedArgs);

        if (!result.success) {
          throw new Error(result.error || 'Tool execution failed');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to execute tool '${name}': ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server started');
  }
}
