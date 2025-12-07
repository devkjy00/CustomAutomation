import { MCPServer } from './server.js';

async function main() {
  try {
    const server = new MCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.error('MCP Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('MCP Server shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

