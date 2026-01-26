import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Modrinth prefixed routes
router.get("/card/summary/:username", (req, res) => res.redirect("/")); // Deprecated
router.get("/card/user/:username", (req, res) => res.redirect("/")); // Deprecated

// Bare URL redirects (backward compatibility)
router.get("/user/:username", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}`));
router.get("/user/:username/downloads", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/downloads`));
router.get("/user/:username/projects", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/projects`));
router.get("/user/:username/followers", (req, res) => res.redirect(301, `/modrinth/user/${req.params.username}/followers`));

router.get("/modrinth/user/:username", cardController.getUser);

router.get("/modrinth/user/:username/downloads", badgeController.getUserDownloads);
router.get("/modrinth/user/:username/projects", badgeController.getUserProjects);
router.get("/modrinth/user/:username/followers", badgeController.getUserFollowers);

export default router;
