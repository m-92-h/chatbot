# MCP Express Application (Streamable HTTP Transport)

---

## 🏗 Architecture & Overview

This project implements an MCP Server and MCP Client integrated with Google Gemini API (`@google/genai`). It allows the LLM to dynamically discover and invoke custom server-side tools (`calculate_bmi` and `get_server_time`) over standard HTTP requests.

### Key Highlights
- **Transport**: `StreamableHTTPServerTransport` & `StreamableHTTPClientTransport`.
- **Session Handling**: State/Session tracking via custom HTTP headers (`mcp-session-id`).
- **Serverless Ready**: Request/response paradigm that effortlessly scales on Serverless platforms (e.g., Vercel, AWS Lambda).
---

## 📁 Directory Structure

```text
MCP_APP/
├── public/                  # Frontend static interface
│   └── index.html
├── src/
│   ├── controllers/         # HTTP Handlers
│   │   ├── mcp-server.controller.ts
│   │   └── chat.controller.ts
│   ├── routes/              # Express API Routes
│   │   ├── mcp.routes.ts
│   │   ├── chat.routes.ts
│   │   └── index.ts
│   ├── mcp/
│   │   ├── client/          # MCP Client & Gemini Orchestrator
│   │   │   └── mcpClient.ts
│   │   └── server/          # MCP Server & Tool Registration
│   │       ├── tools/
│   │       │   ├── bmi.tool.ts
│   │       │   └── time.tool.ts
│   │       └── mcpServer.ts
│   └── app.ts               # Express App initialization & entry
├── .env
├── package.json
└── tsconfig.json