import express from "express";
import * as metaController from "../controllers/metaController.js";
import * as curseforgeController from "../controllers/curseforgeController.js";

const router = express.Router();

// Modrinth meta endpoint
router.get("/meta/:type/:id", metaController.getMeta);

// CurseForge meta endpoint
router.get("/meta/curseforge/:modId", curseforgeController.getCfMeta);

export default router;
