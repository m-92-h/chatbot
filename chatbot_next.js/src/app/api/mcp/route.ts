import { createMcpServer } from "@/lib/mcp/mcpServer";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { type NextRequest, NextResponse } from "next/server";

// Vercel max duration — MCP tool calls can take time
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // لكل طلب نُنشئ نسخة جديدة من السيرفر والـ transport
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({});

    await server.connect(transport as Transport);

    // نحوّل NextRequest إلى ما يتوقعه transport.handleRequest
    // StreamableHTTPServerTransport يحتاج req/res بصيغة Node.js
    // لذلك نبني استجابة يدوياً عبر ReadableStream
    const responseBody = await new Promise<string>((resolve, reject) => {
      let responseData = "";

      // نعطي الـ transport mock للـ res حتى يكتب الرد
      const mockRes = {
        statusCode: 200,
        headersSent: false,
        headers: {} as Record<string, string>,
        setHeader(name: string, value: string) {
          this.headers[name.toLowerCase()] = value;
        },
        write(chunk: string | Buffer) {
          responseData += typeof chunk === "string" ? chunk : chunk.toString();
        },
        end(chunk?: string | Buffer) {
          if (chunk)
            responseData +=
              typeof chunk === "string" ? chunk : chunk.toString();
          resolve(responseData);
        },
        on(_event: string, _listener: () => void) {
          return this;
        },
      };

      // نبني mock للـ req المتوافق مع Node.js IncomingMessage
      const mockReq = {
        method: "POST",
        headers: Object.fromEntries(req.headers.entries()),
        body,
      };

      transport
        .handleRequest(mockReq as never, mockRes as never, body)
        .catch(reject);
    });

    await server.close();
    await transport.close();

    return new NextResponse(responseBody, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MCP] Error handling request:", message);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error", data: message },
        id: null,
      },
      { status: 500 },
    );
  }
}

// حظر كل الطرق الأخرى
export async function GET() {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method Not Allowed: only POST is supported",
      },
      id: null,
    },
    { status: 405 },
  );
}