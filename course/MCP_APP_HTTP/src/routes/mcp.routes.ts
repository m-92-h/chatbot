import { Router } from "express";
import { McpServerController } from "../controllers/mcp-server.controller.js";

const router = Router();
router.post("/", McpServerController.handlePost);
router.get("/", McpServerController.handleGet);

export default router;