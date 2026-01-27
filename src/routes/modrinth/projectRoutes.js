import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/modrinth/project/:slug", cardController.getProject);

router.get("/project/:slug", (req, res) => res.redirect(301, `/modrinth/project/${req.params.slug}`)); // Deprecated

// Badge routes
router.get("/modrinth/project/:slug/downloads", badgeController.getProjectDownloads);
router.get("/modrinth/project/:slug/followers", badgeController.getProjectFollowers);
router.get("/modrinth/project/:slug/versions", badgeController.getProjectVersions);

router.get("/project/:slug/downloads", (req, res) => res.redirect(301, `/modrinth/project/${req.params.slug}/downloads`)); // Deprecated
router.get("/project/:slug/followers", (req, res) => res.redirect(301, `/modrinth/project/${req.params.slug}/followers`)); // Deprecated
router.get("/project/:slug/versions", (req, res) => res.redirect(301, `/modrinth/project/${req.params.slug}/versions`)); // Deprecated

export default router;
