# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-project repository containing three distinct projects for AI automation and messaging:

1. **CustomAutomation** - Spring Boot application for AI integration and Kakao messaging
2. **MCP** - Model Context Protocol server implementation
3. **AI/my-project** - Express.js application using Dalai for local LLM inference

## CustomAutomation (Spring Boot)

### Technology Stack
- Java 17
- Spring Boot 3.2.0 with Spring Cloud
- OpenFeign for HTTP clients
- WebFlux for reactive programming
- Lombok for code generation
- Gradle build system

### Build and Run Commands

```bash
# Navigate to the project
cd CustomAutomation

# Build the project
./gradlew build

# Run the application
./gradlew bootRun

# Run tests
./gradlew test

# Clean build
./gradlew clean build
```

### Architecture

**Main Application Entry**: `src/main/java/jy/demo/CustomautoApplication.java`

**Package Structure**:
- `api/` - External API clients (ChatGPT, Dalai, WebClient implementations)
- `config/` - Spring configuration (CORS, Bean configs)
- `controller/` - REST controllers (AI, Auth, Message, Test endpoints)
- `dto/` - Data Transfer Objects (Kakao message/OAuth DTOs)
- `service/` - Business logic (Dalai, Kakao messaging services)
- `util/` - Utilities (HTTP, JSON, Kakao constants)

**Key Components**:
- **AIController** (`controller/AIController.java`): Exposes endpoints for AI operations
  - `/refactoring` - ChatGPT code refactoring endpoint
  - `/ai` - Dalai local LLM endpoint
- **API Clients**: Feign clients for ChatGPT and Dalai integration
- **Kakao Integration**: OAuth and messaging functionality for Kakao platform

**Configuration**:
- Server runs on port 8081
- Configuration in `src/main/resources/application.yml`
- Contains API keys for OpenAI and Kakao (stored in application.yml - consider moving to environment variables)
- Active profile: prod

### Important Notes
- The application integrates with both cloud-based (ChatGPT) and local (Dalai) AI models
- Kakao OAuth redirect URL is configured for external access via `southoftheriver.synology.me`
- Uses native macOS ARM64 Netty resolver for performance

## MCP (Model Context Protocol Server)

### Technology Stack
- TypeScript
- Node.js with ES Modules
- @modelcontextprotocol/sdk
- Zod for schema validation
- Jest for testing

### Build and Run Commands

```bash
# Navigate to the project
cd MCP

# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production
npm start

# Run tests
npm test
```

### Architecture

**Main Entry**: `src/index.ts` - Bootstraps the MCP server with graceful shutdown handling

**Core Structure**:
- `src/server.ts` - MCPServer class implementing the MCP protocol
  - Handles tool listing via `ListToolsRequestSchema`
  - Handles tool execution via `CallToolRequestSchema`
  - Uses stdio transport for communication
- `src/tools/` - Tool implementations (calculator, weather)
- `src/types/` - TypeScript type definitions and Zod schemas

**Tool System**:
- Tools are registered in `src/tools/index.ts`
- Each tool has a description and execute method
- Arguments are validated using Zod schemas before execution
- Tools return structured results with success/error handling

**TypeScript Configuration**:
- Target: ES2022
- Module: ESNext with node resolution
- Output: `dist/` directory
- Strict mode enabled

## AI/my-project (Express + Dalai)

### Technology Stack
- Node.js
- Express.js
- Dalai (local LLM framework)
- Jade templating engine
- MongoDB

### Run Commands

```bash
# Navigate to the project
cd AI/my-project

# Install dependencies (if needed)
npm install

# Start the server
npm start
# or directly
node ./bin/www
```

### Architecture

**Main Application**: `app.js` - Standard Express setup with Jade views

**Structure**:
- `routes/` - Express route handlers
- `views/` - Jade templates
- `public/` - Static assets (stylesheets)
- `bin/www` - Server startup script

This is a simple Express application that integrates with Dalai for running large language models locally. It serves as a web interface for AI interactions.

## Development Workflow

### Working with CustomAutomation
1. Ensure Java 17 is installed
2. Use Gradle wrapper commands (no need to install Gradle globally)
3. The application uses Spring Boot DevTools for hot reload during development
4. API endpoints are RESTful and documented in controller classes
5. Configuration is externalized in `application.yml`

### Working with MCP
1. The server uses stdio transport - it's designed to communicate via standard input/output
2. When adding new tools:
   - Create tool class in `src/tools/`
   - Add Zod schema in `src/types/`
   - Register in `src/tools/index.ts`
   - Update server.ts schema validation switch statement
3. Tests should be co-located with tool implementations (`*.test.ts`)
4. Build before running in production to ensure TypeScript compilation

### Working with AI/my-project
1. This is a legacy Node.js/Express application
2. Uses Jade templating (older syntax, consider migrating to Pug or modern templates)
3. Integrates with Dalai which requires model files to be downloaded separately
4. MongoDB connection details would need to be configured for database operations

## Cross-Project Integration

The three projects work together:
- **CustomAutomation** acts as the main backend API orchestrator
- **CustomAutomation** can call both cloud APIs (ChatGPT) and local inference (Dalai)
- **MCP** provides a protocol layer for tool execution that could be consumed by AI systems
- **AI/my-project** provides a web interface for direct Dalai interaction

## Security Considerations

- API keys are currently stored in `CustomAutomation/src/main/resources/application.yml`
- For production, move sensitive credentials to environment variables or secure vault
- Kakao OAuth tokens and OpenAI keys should never be committed to version control
- Consider using Spring Cloud Config or similar for centralized configuration management
