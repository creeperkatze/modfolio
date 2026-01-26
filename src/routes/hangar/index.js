import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/hangar/project/:slug", cardController.getHangarProject);
router.get("/hangar/user/:username", cardController.getHangarUser);

// Badge routes
router.get("/hangar/project/:slug/downloads", badgeController.getHangarProjectDownloads);
router.get("/hangar/project/:slug/versions", badgeController.getHangarProjectVersions);
router.get("/hangar/project/:slug/views", badgeController.getHangarProjectViews);
router.get("/hangar/user/:username/downloads", badgeController.getHangarUserDownloads);
router.get("/hangar/user/:username/projects", badgeController.getHangarUserProjects);
router.get("/hangar/user/:username/stars", badgeController.getHangarUserStars);

export default router;
