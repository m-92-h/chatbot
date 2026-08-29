import { Router } from "express";
import mcpRoutes from "./mcp.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

router.use("/mcp", mcpRoutes);
router.use("/api/chat", chatRoutes);

export default router;