import express from "express";
import * as curseforgeController from "../../controllers/curseforgeController.js";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Slug lookup route (resolve CurseForge slugs to IDs)
router.get("/curseforge/lookup/:slug", curseforgeController.getCfSlugLookup);

// User lookup route (resolve CurseForge usernames to IDs)
router.get("/curseforge/lookup/user/:username", curseforgeController.getCfUserLookup);

// Card routes
router.get("/curseforge/project/:projectId", cardController.getCfMod);

// Badge routes
router.get("/curseforge/project/:projectId/downloads", badgeController.getCfModDownloads);
router.get("/curseforge/project/:projectId/versions", badgeController.getCfModVersions);
router.get("/curseforge/project/:projectId/rank", badgeController.getCfModRank);

export default router;
