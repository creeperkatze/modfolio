import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Deprecated
router.get("/card/summary/:username", (req, res) => res.redirect("/")); // Deprecated
router.get("/card/user/:username", (req, res) => res.redirect("/")); // Deprecated

// Card routes
router.get("/modrinth/user/:username", cardController.getUser);

router.get("/user/:username", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}`)); // Deprecated

// Badge routes
router.get("/modrinth/user/:username/downloads", badgeController.getUserDownloads);
router.get("/modrinth/user/:username/projects", badgeController.getUserProjects);
router.get("/modrinth/user/:username/followers", badgeController.getUserFollowers);

router.get("/user/:username/downloads", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/downloads`)); // Deprecated
router.get("/user/:username/projects", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/projects`)); // Deprecated
router.get("/user/:username/followers", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/followers`)); // Deprecated

export default router;
