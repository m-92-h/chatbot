import { Router } from "express";
import { handleChat } from "../controllers/chat.Controller.js";

const router = Router();

router.post("/", handleChat);

export default router;