# MCP Express Application (SSE Transport)

A full-stack Node.js & TypeScript application showcasing the Model Context Protocol (MCP) using traditional **Server-Sent Events (SSE) Transport**.

---

## 🏗 Architecture & Overview

This project implements an MCP Server and Client using persistent HTTP connections for streaming event updates from the server to the client.

### Key Highlights
- **Transport**: `SSEServerTransport` & `SSEClientTransport`.
- **Connection Model**: Persistent `GET` stream for listening to events + `POST` endpoint for sending messages.
- **Session Handling**: Sessions are passed via URL query parameters (`/mcp/sse?sessionId=...`).
- **Use Case**: Best suited for long-running stateful application servers (VPS, Dedicated instances, Docker containers).

---