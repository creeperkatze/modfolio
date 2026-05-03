import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/curseforge/user/:id", cardController.getCfUser);

// Badge routes
router.get("/curseforge/user/:id/downloads", badgeController.getCfUserDownloads);
router.get("/curseforge/user/:id/projects", badgeController.getCfUserProjects);
router.get("/curseforge/user/:id/followers", badgeController.getCfUserFollowers);

export default router;
