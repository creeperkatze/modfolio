import express from "express";
import * as curseforgeController from "../../controllers/curseforgeController.js";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Slug lookup route (resolve CurseForge slugs to IDs)
router.get("/curseforge/lookup/:slug", curseforgeController.getCfSlugLookup);

// Card routes
router.get("/curseforge/project/:modId", cardController.getCfMod);

// Badge routes
router.get("/curseforge/project/:modId/downloads", badgeController.getCfModDownloads);
router.get("/curseforge/project/:modId/rank", badgeController.getCfModRank);
router.get("/curseforge/project/:modId/versions", badgeController.getCfModVersions);

export default router;
