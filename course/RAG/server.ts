import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import chatRoutes from "./src/routes/chat.Routes.js";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("RAG Agent API is running!");
});

app.use("/api/chat", chatRoutes);

// Error in express (Global Error Handler)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express Error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Error out express
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
