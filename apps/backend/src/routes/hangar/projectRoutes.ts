import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/hangar/project/:slug", cardController.getHangarProject);

// Badge routes
router.get("/hangar/project/:slug/downloads", badgeController.getHangarProjectDownloads);
router.get("/hangar/project/:slug/versions", badgeController.getHangarProjectVersions);
router.get("/hangar/project/:slug/views", badgeController.getHangarProjectViews);

export default router;
